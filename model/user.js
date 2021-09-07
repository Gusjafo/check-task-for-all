const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String },
    name: { type: String },
    key: {
        oid: { type: String },
        tid: { type: String }
    },
    priority: { type: Number }
});


module.exports = mongoose.model("User", userSchema)