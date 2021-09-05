require('dotenv').config();
require("./config/database").connect();

const express = require('express');
const mongoose = require('mongoose');
// const msal = require('@azure/msal-node');
const routing = require('./router/routing');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);



const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(express.static("public"));
app.use('/', routing);

let itemsLocal = [];
let actualUserToken = "";


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

    let token_key = req.query.code;
    
   
    console.log("CODE: " + tokenRequest.code);
    cca.acquireTokenByCode(tokenRequest).then((response) => {

        console.log("\n response: ", response);

        console.log("\n\n token: ", response.idToken);
        console.log("\n username: ", response.account.username);
        console.log("\n name: ", response.account.name);
        console.log("\n oid: ", response.account.idTokenClaims.oid);
        console.log("\n tid: ", response.account.idTokenClaims.tid);

        let userkey = response.account.idTokenClaims.oid + "/" + response.account.idTokenClaims.tid;
        console.log(userkey);

        User.findOne({ key: userkey }, function (err, user) {
            if (err) {
                return handleError(err);
            } else {
                // console.log("before segundo: ", user);
                if (user === null) {
                    addNewUser(response);
                }
            }
        });

        function addNewUser(response) {
            const user = new User({
                email: response.account.username,
                name: response.account.name,
                key: userkey,
                token_key: token_key,
            });

            user.save(function (err) {
                if (err) return handleError(err);
                // saved!
            });
        };

        actualUserToken = tokenRequest.code;
        // console.log(actualUserToken);

        res
        .status(200)
        .cookie('token', response.idToken)
        .redirect(301, '/inicio');

        // res.sendStatus(200);
        // setTimeout(() => {
        //     res.redirect('/inicio');
        // },3000);

    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.get('/inicio', auth, (req, res) => {
    // console.log("llegue a inicio", req);
    User.findOne({ token_key: actualUserToken }, function (err, user) {
        if (err) {
            return handleError(err);
        } else {
            // console.log("inside /inicio ", user);
            if (user) {
                Item.find({}, function (err, foundItems) {
                    itemsLocal = foundItems;
                    var dayToSend = actualDay();
                    res.render("list", {
                        listTitle: dayToSend,
                        newListItems: foundItems,

                    });
                });
            } else {
                res.send("User don't identify")
            }
        }
    });


    // Item.find({}, function (err, foundItems) {
    //     itemsLocal = foundItems;
    //     var dayToSend = actualDay();
    //     res.render("list", {
    //         listTitle: dayToSend,
    //         newListItems: foundItems
    //     });
    // });
})

app.get("/update", function (req, res) {
    var dayToSend = actualDay();
    res.render("update", {
        listTitle: dayToSend
    });
})

app.post("/update", function (req, res) {
    var itemToAdd = req.body.inputDesc;
    const item = new Item({
        numberOfTask: 8,
        descriptionTask: itemToAdd,
        checkbox: "",
        timeEvent: ""
    })

    item.save(function (err) {
        if (err) return handleError(err);
        // saved!
    });

    res.redirect("/update");
})

io.on('connection', (socket) => {
    socket.on('chat message', msg => {
        console.log("Llegando a servidor " + msg)

        var checkedItemId = msg;
        var checked = "";
        var timeToSend = actualTime();

        itemsLocal.forEach(function (itemLocal) {
            if (itemLocal._id == checkedItemId) {
                itemLocal.checkbox == "checked" ? checked = "" : checked = "checked";
                checked == "checked" ? timeToSend = timeToSend : timeToSend = "";
            }
        });

        Item.findOneAndUpdate(
            { _id: checkedItemId },
            { checkbox: checked, timeEvent: timeToSend },
            function (err) {
                if (!err) {
                    console.log("Successfully updated checked item.");
                }
            });


        io.emit('chat message', msg);

    });
});

function actualTime() {
    var currentTime = new Date();
    var hourNow = currentTime.getHours();
    var minuteNow = currentTime.getMinutes();
    var secondNow = currentTime.getSeconds();
    var timeNow = `${hourNow}:${minuteNow}:${secondNow}`;
    return (timeNow);
};

function actualDay() {
    var currentDay = new Date();
    // var options = {weekday: "long", year: "numeric", month: "long", day: "numeric"};
    var options = { weekday: "long", day: "numeric" };
    var dayNow = currentDay.toLocaleDateString("es-ES", options);
    // var dayNow = currentDay.getDay();  
    return (dayNow);
};


http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
})