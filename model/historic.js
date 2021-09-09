const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema({
    numberOfTask: Number,
    descriptionTask: String,
    checkbox: String,
    timeEvent: String,
    updatedBy: String
});

const historicSchema = new mongoose.Schema({
    name: String,
    savedBy: String,
    tasks: [itemsSchema]
});

module.exports = mongoose.model('Historic', historicSchema);
