const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema({
    numberOfTask: Number,
    descriptionTask: String,
    checkbox: String,
    timeEvent: String,
    updatedBy: String
});


module.exports = mongoose.model("Item", itemsSchema)