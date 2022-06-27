const mongoose = require("mongoose");

const User = mongoose.model('User', {
    name: String,
    username: String,
    series: []
});

module.exports = User;