require('dotenv').config();
require("./config/database").connect();

const express = require('express');
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

const Item = require("./model/item");

const Historic = require("./model/historic");

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
                    // console.log(foundItems);
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
                }).sort({ numberOfTask: 1 });
            } else {
                res.send("User don't identify")
            }
        }
    });
})

app.get("/update", auth, (req, res) => {
    let numberOfMaxTask = 0;
    let decoded = decodeToken(req);

    Item.find({},
        function (err, foundMaxItem) {
            if (err) {
                console.log(err);
                return handleError(err);
            }
            if (foundMaxItem[0].numberOfTask == undefined) {
                numberOfMaxTask = 0;
            } else {
                numberOfMaxTask = foundMaxItem[0].numberOfTask + 1;
            }
        }).sort({ numberOfTask: -1 }).limit(1);

    User.findOne({ key: { oid: decoded.oid, tid: decoded.tid } },
        function (err, user) {
            if (err) {
                console.log(err);
                return handleError(err);
            } else {
                if (user.priority == process.env.ADMIN) {
                    var dayToSend = actualDay();
                    res.render("update", {
                        listTitle: dayToSend,
                        numberOfTask: numberOfMaxTask
                    });
                } else {
                    res.redirect(401, '/inicio');
                }
            }
        })
})

app.post("/update", auth, (req, res) => {
    const item = new Item({
        numberOfTask: req.body.inputTask,
        action: req.body.action,
        op: req.body.encargado,
        descriptionTask: req.body.inputDesc,
        checkbox: "",
        timeEvent: "",
        updatedBy: "",
        observation: ""
    });
    item.save(function (err, result) {
        if (err) {
            return handleError(err);
        } else {
            console.log(result);
            let taskAdded = result.numberOfTask;
            let idTaskAdded = result._id;
            Item.updateMany(
                {
                    $and: [{ numberOfTask: { $gte: taskAdded } },
                    { _id: { $ne: idTaskAdded } }]
                },
                { $inc: { numberOfTask: 1 } },
                { multi: true }, function (err) {
                    if (err) {
                        console.log(err);
                        return handleError(err);
                    }
                });
        }
        // saved!
    });
    setTimeout(() => {
        res.redirect("/update");
    }, 400);
})

app.post('/savelist', auth, (req, res) => {
    console.log(req.body.title);
    let title = req.body.title;
    let decoded = decodeToken(req);

    User.findOne({ key: { oid: decoded.oid, tid: decoded.tid } },
        function (err, user) {
            if (err) {
                console.log(err);
                return handleError(err);
            } else {
                if (user.priority == process.env.ADMIN) {
                    Item.find({},
                        function (err, foundItems) {
                            if (err) {
                                console.log(err);
                                return handleError(err);
                            } else {
                                const historic = new Historic({
                                    date: title,
                                    savedBy: decoded.preferred_username,
                                    tasks: foundItems
                                });
                                historic.save();
                                console.log("Successfully saved to historic");
                                res.redirect(200, '/inicio');
                            }
                        });

                } else {
                    res.redirect(401, '/inicio');
                }
            }
        });
})

app.get('/historic', auth, (req, res) => {

})

io.on('connection', (socket) => {

    socket.on('checkbox changed', (msg, obsField, tokenUser) => {
        console.log( msg + " " + obsField + " ")
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
                    {
                        checkbox: checked,
                        timeEvent: timeToSend,
                        updatedBy: name,
                        observation: obsField
                    },
                    function (err) {
                        if (!err) {
                            console.log("Successfully updated checked item.");
                        }
                    });
            }
        })
        setTimeout(() => {
            io.emit('checkbox changed', msg);
        }, 400);
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
    var options = { weekday: "long", year: 'numeric', month: 'long', day: "numeric" };
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

// function updateDuplicateTask(newNumberOfTask, idItemNewTask) {
//     Item.findOneAndUpdate(
//         { _id: checkedItemId },
//         { checkbox: checked, timeEvent: timeToSend, updatedBy: name },
//         function (err) {
//             if (!err) {
//                 console.log("Successfully updated checked item.");
//             }
//         });        
// }


http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
})