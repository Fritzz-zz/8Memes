const mongoose = require("mongoose")

var UserSchema = mongoose.Schema({
    username :  String,
    fullname : String,
    password : String,
    desc : String,
    profilepic : String
})

var User = mongoose.model("user", UserSchema)

module.exports = {
    User
}
//in a diff file
