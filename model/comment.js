const mongoose = require("mongoose")

var CommentSchema = mongoose.Schema({
    commentposter :  String,
    commentmeme : String,
    commenttext : String
})

var Comment = mongoose.model("comment", CommentSchema)

module.exports = {
    Comment
}
//in a diff file
