const Mongoose = require("mongoose");

var PunchSchema = new Mongoose.Schema({
    id: String,
    date: { type: Date, default: Date.now() },
    length: Number,
    description: String
});

module.exports = Mongoose.model('punch', PunchSchema);