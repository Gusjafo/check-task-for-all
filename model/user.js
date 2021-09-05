const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String },
    name: { type: String },
    key: { type: String },
});


module.exports = mongoose.model("User", userSchema)