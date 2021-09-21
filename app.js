require('dotenv').config();
require("./config/database").connect();

const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(express.static("public"));
const Item = require("./model/item");
const Historic = require("./model/historic");
const User = require("./model/user");
const auth = require("./middleware/auth");
let unitRun = "";

// Create msal application object
const cca = require("./config/login");

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: `${process.env.REDIRECT}`,
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: `${process.env.REDIRECT}`,
    };
    cca.acquireTokenByCode(tokenRequest).then((response) => {
        let oidUser = response.account.idTokenClaims.oid;
        let tidUser = response.account.idTokenClaims.tid;
        User.findOne({ key: { oid: oidUser, tid: tidUser } }, function (err, user) {
            //  console.log('/redirect ', user);
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
            res
                .status(200)
                .cookie('token', response.idToken)
                .redirect('/preinicio');
        }, 250);
    }).catch((error) => {
        console.log(JSON.stringify(error));
        res.status(500).send(error);
    });
});

app.get('/preinicio', auth, (req, res) => {
    // console.log('en preinicio, auth: ' + auth);
    // console.log('en preinicio, req: ', req.res.user);
    if (unitRun == "") {
        let decoded = req.res.user;
        // console.log('en preinicio, decoded: ', decoded);
        let oidUser = decoded.oid;
        let tidUser = decoded.tid;
        User.findOne({ key: { oid: oidUser, tid: tidUser } }, function (err, user) {
            // console.log(user);
            if (err) {
                console.log(err);
                return handleError(err);
            } if (user) {
                // console.log(user.priority);
                if (user.priority == 0) {
                    res
                        .status(200)
                        .redirect(302, '/inicio');
                } else {
                    res.sendFile(__dirname + '/public/preinicio.html', function (err) {
                        if (err) {
                            console.log(JSON.stringify(err));
                        } else {
                            console.log('Sent')
                        }
                    });
                }
            }
        });
    } else {
        // console.log("hacia inicio");
        if (unitRun == 'historicos') {
            unitTun = '';
            return;
        } else {
            console.log('en preinicio: ' + unitRun);
            res
                .status(200)
                .redirect(302, '/inicio');
        }
    }
});

app.post('/preinicio', auth, (req, res) => {
    // guardar si es U29 o U30 
    // redireccionar a inicio o a historial
    // console.log(req.body.firstChoice);
    unitRun = req.body.firstChoice;
    if (unitRun == 'U 29' || unitRun == 'U 30') {
        res
            .status(200)
            .redirect(302, '/inicio');
    } else {
        res
            .status(200)
            .redirect(302, '/historic');
    }
})

app.get('/inicio', auth, (req, res) => {
    let decoded = req.res.user;
    let oidUser = decoded.oid;
    let tidUser = decoded.tid;
    User.findOne({ key: { oid: oidUser, tid: tidUser } }, function (err, user) {
        if (err) {
            console.log(JSON.stringify(err));
            return handleError(err);
        } else {
            if (user) {
                Item.find({}, function (err, foundItems) {
                    if (err) {
                        console.log(JSON.stringify(err));
                        return handleError(err);
                    } else {
                        let dayToSend = actualDay();
                        let index = dayToSend.indexOf(',');
                        let dayShortToSend = dayToSend.substring(0, (index + 4));
                        res.render("list", {
                            userPriority: user.priority,
                            listTitle: dayShortToSend,
                            listTitle2: 'Arranque ' + unitRun,
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
    let decoded = req.res.user;

    Item.find({}, function (err, foundMaxItem) {
        console.log(foundMaxItem);
        if (err) {
            console.log('en error');
            console.log(JSON.stringify(err));
            numberOfMaxTask = 0;
            return handleError(err);
        }
        if (foundMaxItem == null ||
            foundMaxItem == undefined ||
            foundMaxItem == 0 ||
            foundMaxItem.length == 0) {
            console.log('en segundo if');
            numberOfMaxTask = 1;
            return;
        } else {
            console.log('en else');
            numberOfMaxTask = foundMaxItem[0].numberOfTask + 1;
            return;
        }
    }).sort({ numberOfTask: -1 })
        .limit(1)
        .then(function () {
            User.findOne({ key: { oid: decoded.oid, tid: decoded.tid } },
                function (err, user) {
                    console.log('llegue a findOne');
                    if (err) {
                        console.log(JSON.stringify(err));
                        return handleError(err);
                    } else {
                        if (user.priority == process.env.ADMIN) {
                            let dayToSend = actualDay();
                            let index = dayToSend.indexOf(',');
                            let dayShortToSend = dayToSend.substring(0, (index + 4));
                            res.render("update", {
                                listTitle: 'Arranque ' + unitRun + " - " + dayShortToSend,
                                numberOfTask: numberOfMaxTask
                            });
                        } else {
                            res.redirect(401, '/inicio');
                        }
                    }
                }
            )
        });
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
            // console.log(result);
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
                        console.log(JSON.stringify(err));
                        return handleError(err);
                    }
                }
            ).then(res.redirect("/update"));
        }
    });
});

app.get('/savelist', auth, (req, res) => {
    let dayToSend = actualDay();
    let decoded = req.res.user;
    User.findOne({ key: { oid: decoded.oid, tid: decoded.tid } }, function (err, user) {
        if (err) {
            console.log(JSON.stringify(err));
            return handleError(err);
        } if (user) {
            if (user.priority == process.env.ADMIN || user.priority == process.env.USUARIO) {
                Item.find({}, function (err, foundItems) {
                    if (err) {
                        console.log(JSON.stringify(err));
                        return handleError(err);
                    } if (foundItems) {
                        const historic = new Historic({
                            unit: unitRun,
                            date: dayToSend,
                            savedBy: decoded.preferred_username,
                            tasks: foundItems
                        });
                        historic.save();
                        console.log("Successfully saved to historic");
                        unitRun = "";
                        console.log("unitRun clareada: " + unitRun);
                        cleanMainList();
                        console.log('hacia preinicio');
                        res.redirect(302, '/preinicio')
                    }
                });
            } else {
                console.log('no autorizado');
                res.redirect(401, '/inicio');
            }
        }
    });
})


// The displayWarning() function presents a notification of a problem.
// https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault


app.get('/historic', auth, (req, res) => {
    res.send('Estamos trabajando en ello');
})

io.on('connection', (socket) => {

    socket.on('checkbox changed', (msg, obsField, tokenUser) => {
        // console.log(msg + " " + obsField + " ");
        let checkedItemId = msg;
        let checked = "";
        let timeToSend = actualTime();
        // let decoded = jwt.verify(tokenUser, process.env.TOKEN_KEY);
        let decoded = jwt.decode(tokenUser);
        let name = decoded.preferred_username;
        let index = name.indexOf("@");
        let userName = name.substring(0, index);
        Item.findOne({ _id: checkedItemId }, function (err, item) {
            if (err) {
                console.log(err);
                return handleError(err);
            } if (item) {
                item.checkbox == "checked" ? checked = "" : checked = "checked";
                checked == "checked" ? timeToSend = timeToSend : timeToSend = "";
                Item.findOneAndUpdate(
                    { _id: checkedItemId },
                    {
                        checkbox: checked,
                        timeEvent: timeToSend,
                        updatedBy: userName,
                        observation: obsField
                    },
                    function (err) {
                        if (!err) {
                            console.log("Successfully updated checked item.");
                            io.emit('checkbox changed',
                                msg,
                                obsField,
                                checked,
                                item.numberOfTask,
                                timeToSend,
                                userName);
                        }
                    }
                );
            }
        })
    });
});

function actualTime() {
    let currentTime = new Date();
    currentTime.setHours(currentTime.getHours() - 3);
    // console.log(currentTime);
    currentTime = currentTime.toString();
    currentTime = currentTime.substring(16, 21);
    // console.log(currentTime);
    return (currentTime);
};

function actualDay() {
    let currentDay = new Date();
    let options = { weekday: "long", year: 'numeric', month: 'long', day: "numeric" };
    let dayNow = currentDay.toLocaleDateString("es-ES", options);
    return (dayNow);
};

function cleanMainList() {
    Item.updateMany({},
        { $set: { checkbox: "", timeEvent: "", updatedBy: "", observation: "" } },
        // { upsert: false },
        function (err, foundItems) {
            console.log(foundItems.n + " Items cleaned!");
            if (err) {
                console.log(err);
                return handleError(err);
            }
            if (foundItems) {
                console.log("List cleaned");
                return;
            }
        }
    );
};


http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
})
