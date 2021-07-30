// const { Int32 } = require('bson');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(express.static("public"));

let itemsLocal = [];

mongoose.connect("mongodb+srv://m001-student:m001-mongodb-basics@sandbox.lafax.mongodb.net/runCpbDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set('useFindAndModify', false);

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function () {
//     console.log("conectasdos to DB")
//     // we're connected!
// });

const itemsSchema = new mongoose.Schema({
    numberOfTask: Number,
    descriptionTask: String,
    checkbox: String,
    timeEvent: String
});

const Item = mongoose.model("Item", itemsSchema);

// const item4 = new Item({
//     numberOfTask: 2,
//     descriptionTask: "Hola tu fuck mundo",
//     checkbox: "",
//     timeEvent: "date.now()"
// })



// app.get('/', (req, res) => {
//     Item.find({}, function (err, foundItems) {
//         console.log(foundItems.length);

//         if (foundItems.length === 3) {
//             item4.save(function (err) {
//                 if (err) return handleError(err);
//                 // saved!
//             });
//             res.redirect("/");
//         } else {
//             res.render("list", { listTitle: "Today", newListItems: foundItems });
//         }
//     });
// })

app.get('/', (req, res) => {
    Item.find({}, function (err, foundItems) {
        itemsLocal = foundItems;    
        var dayToSend = actualDay();
        res.render("list", {
            listTitle: dayToSend,
            newListItems: foundItems
        });
    });
})

app.post("/toogleCheckbox", function (req, res) {
    var checkedItemId = req.body.checkbox;
    var checked = "";
    var timeToSend = actualTime(); 

    itemsLocal.forEach(function(itemLocal){
        if(itemLocal._id == checkedItemId) {
            itemLocal.checkbox == "checked" ? checked = "" : checked = "checked";
            checked == "checked" ? timeToSend = timeToSend : timeToSend = "";
        }
    });

    Item.findOneAndUpdate({ _id: checkedItemId }, { checkbox: checked, timeEvent: timeToSend }, function (err) {
        if (!err) {
            console.log("Successfully updated checked item.");
        }
    });    
    // setTimeout(() => {
    //     res.redirect("/");        
    // }, 200);        
    res.redirect("/");
});

function actualTime(){
    var currentTime = new Date();
    var hourNow = currentTime.getHours();
    var minuteNow = currentTime.getMinutes();
    var secondNow = currentTime.getSeconds();
    var timeNow = `${hourNow}:${minuteNow}:${secondNow}`;    
    return(timeNow);
};

function actualDay(){
    var currentDay = new Date();
    // var options = {weekday: "long", year: "numeric", month: "long", day: "numeric"};
    var options = {weekday: "long", day: "numeric"};
    var dayNow = currentDay.toLocaleDateString("es-ES", options);
    // var dayNow = currentDay.getDay();  
    return(dayNow);    
};


app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})