const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema({
    numberOfTask: Number,
    action: String,
    op: String,
    descriptionTask: String,
    checkbox: String,
    timeEvent: String,
    updatedBy: String,
    observation: String
});

module.exports = mongoose.model("Item", itemsSchema);