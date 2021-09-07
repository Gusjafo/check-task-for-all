require('dotenv').config();
require("./config/database").connect();

const express = require('express');
const mongoose = require('mongoose');
// const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const routing = require('./router/routing');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);



const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(express.static("public"));
app.use('/', routing);

const Item = require("./model/item")

const User = require("./model/user");

const auth = require("./middleware/auth");

// Create msal application object
const cca = require("./config/login");


app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        // console.log("PRIMERO: ", response);
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    // console.log("req:", req);
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
    };
    cca.acquireTokenByCode(tokenRequest).then((response) => {
        let oidUser = response.account.idTokenClaims.oid;
        let tidUser = response.account.idTokenClaims.tid;
        User.findOne({ key: { oid: oidUser, tid: tidUser } }, function (err, user) {
            if (err) {
                return handleError(err);
            } else {
                if (user === null) {
                    addNewUser(response);
                }
            }
        });
        function addNewUser(response) {
            const user = new User({
                email: response.account.username,
                name: response.account.name,
                key: {
                    oid: oidUser,
                    tid: tidUser
                },
                priority: 0
            });
            user.save(function (err) {
                if (err) return handleError(err);
                // saved!
            });
        };
        setTimeout(() => {
            console.log("0.5 Segundo esperado");
            res
                .status(200)
                .cookie('token', response.idToken)
                .redirect(301, '/inicio');
        }, 500);

    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.get('/inicio', auth, (req, res) => {
    let decoded = decodeToken(req);
    let oidUser = decoded.oid;
    let tidUser = decoded.tid;
    User.findOne({ key: { oid: oidUser, tid: tidUser } }, function (err, user) {
        if (err) {
            console.log(err);
            return handleError(err);
        } else {
            if (user) {
                Item.find({}, function (err, foundItems) {
                    if (err) {
                        console.log(err);
                        return handleError(err);
                    } else {
                        var dayToSend = actualDay();
                        res.render("list", {
                            listTitle: dayToSend,
                            newListItems: foundItems,
                        });
                    }
                });
            } else {
                res.send("User don't identify")
            }
        }
    });
})

app.get("/update", auth, (req, res) => {
    let decoded = decodeToken(req);
    let oidUser = decoded.oid;
    let tidUser = decoded.tid;
    User.findOne({ key: { oid: oidUser, tid: tidUser } }, function (err, user) {
        if (err) {
            console.log(err);
            return handleError(err);
        } else {
            if (user.priority == process.env.ADMIN) {
                var dayToSend = actualDay();
                res.render("update", {
                    listTitle: dayToSend
                });
            } else {
                res
                    .redirect(401, '/inicio');
            }
        }
    })
})

app.post("/update", function (req, res) {
    var itemToAdd = req.body.inputDesc;
    const item = new Item({
        numberOfTask: 8,
        descriptionTask: itemToAdd,
        checkbox: "",
        timeEvent: "",
        updatedBy: ""
    })

    item.save(function (err) {
        if (err) return handleError(err);
        // saved!
    });

    res.redirect("/update");
})

app.get('/savelist', auth, (req, res) => {

})

app.get('/historic', auth, (req, res) => {

})

io.on('connection', (socket) => {
    socket.on('chat message', (msg, tokenUser) => {
        let checkedItemId = msg;
        let checked = "";
        let timeToSend = actualTime();
        let decoded = jwt.decode(tokenUser);
        let name = decoded.name;
        Item.findOne({ _id: checkedItemId }, function (err, item) {            
            if (err) {
                console.log(err);
                return handleError(err);
            } else {
                item.checkbox == "checked" ? checked = "" : checked = "checked";
                checked == "checked" ? timeToSend = timeToSend : timeToSend = "";
                Item.findOneAndUpdate(
                    { _id: checkedItemId },
                    { checkbox: checked, timeEvent: timeToSend, updatedBy: name },
                    function (err) {
                        if (!err) {
                            console.log("Successfully updated checked item.");
                        }
                    });
            }
        })
        io.emit('chat message', msg);
    });
});

function actualTime() {
    var currentTime = new Date();
    var hourNow = currentTime.getHours();
    var minuteNow = currentTime.getMinutes();
    var timeNow = `${hourNow}:${minuteNow}`;
    return (timeNow);
};

function actualDay() {
    var currentDay = new Date();
    var options = { weekday: "long", day: "numeric" };
    var dayNow = currentDay.toLocaleDateString("es-ES", options);
    return (dayNow);
};

function decodeToken(req) {
    const tokenReq =
        req.headers.cookie["x-access-token"] ||
        req.headers.cookie ||
        req.headers["x-access-token"];
    let token = tokenReq.split("=").pop();
    const decoded = jwt.decode(token);
    return decoded;
}


http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
})