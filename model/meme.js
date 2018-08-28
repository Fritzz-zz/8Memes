const mongoose = require("mongoose")

var MemeSchema = mongoose.Schema({
    title :  String,
    poster : String,
    image : String,
    likes : Number,
    setting : String,
    tag: String,
    shared: String
})

var Meme = mongoose.model("meme", MemeSchema)

module.exports = {
    Meme
}
//in a diff file
