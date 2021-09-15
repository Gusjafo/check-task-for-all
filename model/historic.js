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

const historicSchema = new mongoose.Schema({
    unit: String,
    date: String,
    savedBy: String,
    tasks: [itemsSchema]
});

module.exports = mongoose.model('Historic', historicSchema);
