//save this file as database.js

module.exports = function (app) {
    const mongoose = require("mongoose");
    mongoose.connect(
        "**mongoDB-connection-string**"
    ).then(() => {
        console.log("Connected to mongoDB");
        app.listen(3000);
    }).catch((err) => {
        console.log(err);
    });
}