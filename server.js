/*****IMPORTS*****/
const express = require("express")
const mongoose = require("mongoose")
const hbs = require("hbs")
const bodyparser = require("body-parser")
const path = require("path")
const cookieparser = require("cookie-parser")
const session = require("express-session")
//const Food = require("./model/food.js").Food
//const {Food} = require("./model/food.js")
const {Comment} = require("./model/comment.js")
const {Meme} = require("./model/meme.js")
const {User} = require("./model/user.js")

/***** SETUP *******************************/
const app = express()
const urlencoder = bodyparser.urlencoded({
  extended: false  
})
app.set("view-engine", "hbs")
app.use(express.static(__dirname + "/public"))

app.use(session({
    secret: "super secret",
    name: "super secret",
    resave: true,
    saveUninitialized: true,
    // store: new mongostore({
    //   mongooseConnection:mongoose.connection,
    //   ttl : 60*60*24
    // })
    cookie: {
      maxAge: 1000*60*60*24*7*3
    }
}))

mongoose.Promise = global.Promise
mongoose.connect("mongodb://localhost:27017/memes", {
    useNewUrlParser:true
})

app.use(cookieparser())

var tempusers = []
var tempmemes = []
/***** ROUTES ******************************/

app.get("/", (req, res) =>{
    
    var username = req.session.username
    
    if (req.session.username) {
        
    Meme.find({"setting" : "public"}).sort({_id:-1}).then((memes)=>{ 
        res.render("home.hbs", {
            memes,
            username
        })
    }, (err)=>{
        error: "Something went wrong, try again."
    })
    } else {
    Meme.find({"setting" : "public"}).sort({_id:-1}).then((memes)=>{
        res.render("index.hbs", {
            memes
        })
    }, (err)=>{
        error: "Something went wrong, try again."
    })
    }


    
    
})

app.get("/gotologin", (req, res) => {
    console.log("GET /gotologin")
    res.render("login.hbs", {
        })

})

app.get("/gotosignup", (req, res) => {
    console.log("GET /gotosignup")
    res.render("signup.hbs", {
        })

})

app.post("/signup", urlencoder, (req, res) => {
    console.log("POST /signup")
    var username = req.body.username
    var fullname = req.body.fullname
    var password = req.body.password
    var desc = req.body.desc
    var profilepic = req.body.profilepic
    

    
    if (username && fullname && password && desc && profilepic) {
        if (checkAvailability({username})) {
            req.session.username = username
            var u = new User({
                username, 
                fullname, 
                password,
                desc,
                profilepic
            })
            u.save().then((newUser)=>{
                //things went right
                res.redirect("/")
                console.log("added" + newUser.username + " " + newUser.fullname + " " + password + " " + desc + " " + profilepic)
            }, (err)=>{
                //things went wrong
                res.render("signup.hbs", {
                    error: "Something went wrong " + err
            })
            })
        } else {
            res.render("signup.hbs", {
                error: "username has already been taken"
            })
        }
    } else {

        res.render("signup.hbs", {
            error: "incomplete credentials, please try again"
        })
    }
})

app.post("/login", urlencoder, (req, res) => {
    console.log("POST /login")

    var username = req.body.username
    var password = req.body.password

    if (validate({
            username, password
        })) {
        console.log("correct credentials")

        // create session
        req.session.username = username

        res.redirect("/")
    } else {
        res.render("login.hbs", {
            error: "wrong credentials"
        })
    }
})
         
app.post("/addmeme", urlencoder, (req,res)=>{
    console.log("post /add")
    console.log("imagepath " + req.body.memeimage)
    //input -get name, cuisine, price
    var title = req.body.memetitle
    var poster = req.session.username
    var image = req.body.memeimage
    var likes = 0
    var setting = req.body.memesetting
    var tag = req.body.memetag
    var shared = req.body.shared
    //process - add to db
    //new Food({name, cuisine, price}).save()
    var m = new Meme({
        title, 
        poster, 
        image,
        likes,
        setting,
        tag,
        shared
    })
    m.save().then((newMeme)=>{
        //things went right
        res.redirect("/")
        console.log("added" + newMeme.title)
    }, (err)=>{
        //things went wrong
        res.render("index.hbs", {
            error : "Something went wrong " + err
        })
    })

})

app.get("/logout", (req, res) => {
    console.log("GET /logout")
    console.log("User " + req.session.username + " logged out")

    req.session.destroy((err) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Succesfully destroyed session")
        }
    });
    res.redirect("/")
})

app.get("/home", (req, res) => {
    console.log("GET /home")

    res.redirect("/")
})
app.get("/about", (req, res) => {
    console.log("GET /about")

    res.render("about.hbs")
})

app.post("/searchmeme", urlencoder, (req,res)=>{
    
    var vartag = req.body.searchmemeinput
    var username = req.session.username
    
    if (req.session.username) {
    Meme.find({$or : [{"tag" : {'$regex':vartag, '$options' : 'i'}},{"title" : {'$regex':vartag, '$options' : 'i'}} ]}).sort({_id:-1}).then((memes)=>{
        res.render("search.hbs", {
            memes,
            username,
            vartag
        })
    }, (err)=>{
        error: "Something went wrong, try again."
    })
    } else {
    Meme.find({$or : [{"tag" : {'$regex':vartag, '$options' : 'i'}},{"title" : {'$regex':vartag, '$options' : 'i'}} ]}).sort({_id:-1}).then((memes)=>{
        res.render("searcho.hbs", {
            memes,
            vartag
        })
    }, (err)=>{
        error: "Something went wrong, try again."
    })
    }
    
})
app.post("/openmeme", urlencoder, (req,res)=>{
    console.log("GET /openmeme" +req.body.id)
    var bodyid = req.body.id
    var username = req.session.username
    
    if (req.session.username) {
    Meme.find({"_id" : bodyid}).then((memes)=>{
        Comment.find({"commentmeme" : bodyid}).sort({_id:-1}).then((comments)=>{
            res.render("meme.hbs", {
                username,
                memes,
                comments
            })
        })

    }, (err)=>{
        error: "Something went wrong, try again."
    })
    } else {
    Meme.find({"_id" : bodyid}).then((memes)=>{
        Comment.find({"commentmeme" : bodyid}).sort({_id:-1}).then((comments)=>{
            res.render("memeo.hbs", {
                memes,
                comments
            })
        })
    }, (err)=>{
        error: "Something went wrong, try again."
    })
    }
})

app.post("/comment", urlencoder, (req,res)=>{
    console.log("post /comment")
    //input -get name, cuisine, price
    var commentposter = req.session.username
    var commentmeme = req.body.commentmeme
    var commenttext = req.body.commenttext
    var username = req.session.username
    
    //process - add to db
    //new Food({name, cuisine, price}).save()
    var c = new Comment({
        commentposter, 
        commentmeme, 
        commenttext,
    })
    c.save().then((newComment)=>{
        if (req.session.username) {
        Meme.find({"_id" : commentmeme}).then((memes)=>{
            Comment.find({"commentmeme" : commentmeme}).sort({_id:-1}).then((comments)=>{
                res.render("meme.hbs", {
                    commentposter,
                    memes,
                    comments,
                    username
                })
            })

        }, (err)=>{
            error: "Something went wrong, try again."
        })
        } else {
        Meme.find({"_id" : commentmeme}).then((memes)=>{
            Comment.find({"commentmeme" : commentmeme}).sort({_id:-1}).then((comments)=>{
                res.render("meme.hbs", {
                    memes,
                    comments
                })
            })
        }, (err)=>{
            error: "Something went wrong, try again."
        })
        }
    }, (err)=>{
        //things went wrong
        res.render("index.hbs", {
            error : "Something went wrong " + err
        })
    })

})

app.post("/goprofile", urlencoder, (req, res) =>{
    
    var myusername = req.session.username
    var profile = req.body.profile
    

    User.find({"username" : profile}).then((user)=>{
        if (req.session.username) {
        Meme.find({"poster" : profile}).sort({_id:-1}).then((memes)=>{
            Meme.findOne({"poster" : profile}).sort({_id:-1}).then((recentmeme)=>{
                var recent = recentmeme.image
                res.render("profile.hbs", {
                    memes,
                    user,
                    myusername,
                    recent
                })
            }, (err)=>{
                error: "Something went wrong, try again."
            })
            })
        } else {
        Meme.find({"poster" : profile}).sort({_id:-1}).then((memes)=>{
            Meme.findOne({"poster" : profile}).sort({_id:-1}).then((recentmeme)=>{
                var recent = recentmeme.image
                res.render("profileo.hbs", {
                    memes,
                    user,
                    recent
                })
                })
            }, (err)=>{
                error: "Something went wrong, try again."
            })
        } 

    // output - show all foods (via adapter)
    })
})

app.post("/share", urlencoder, (req, res)=>{
    console.log("GET /share" +req.body.id)
    var username = req.session.username
    
    Meme.findOne({
        _id: req.body.id
    }).then((meme)=>{
        res.render("share.hbs",{
            username,
            meme
        })
    })

})

app.get("/viewMeme", urlencoder, (req,res)=>{
    var username = req.session.username
    console.log("GET /viewMeme" +req.query.id)
    Meme.findOne({
        _id: req.query.id
    }).then((meme)=>{
        res.render("edit.hbs",{
            username,
            meme
        })
    })
})

app.post("/edit", urlencoder, (req,res)=>{
    console.log("POST /edit " + req.body.id)
    var username = req.session.username
    
    let newMeme = {
        title :  req.body.memetitle,
        image : req.body.memeimage,
        setting : req.body.memesetting,
        tag: req.body.memetag
    }
    
    Meme.findOneAndUpdate({
        _id : req.body.id
    }, newMeme).then(()=>{
        res.redirect("/")
    })
})

app.post("/deleteMeme", urlencoder, (req,res)=>{
    console.log("POST /deletememe " + req.body.id)
    Meme.remove({
        _id : req.body.id
    }).then(()=>{
        res.redirect("/")
    })
})
app.post("/shareMeme", urlencoder, (req,res)=>{
    console.log("POST /shareMeme " + req.body.id)
   
        res.redirect("/")
    
})
function checkAvailability(user) {
    var match = tempusers.filter((u) => {
        return (u.username === user.username)
    })
    if (match.length == 0) {
        return true
    } else {
        return false
    }
}


function validate(user) {
    var match = tempusers.filter((u) => {
        return (u.username === user.username && u.password === user.password)
    })
    if (match.length == 1) {
        return true
        console.log("match");
    } else {
        return false
        console.log("not a match")
    }
}



function isShared(user,meme){
    var match = tempmemes.filter((u) =>{
        return (u.username === meme.shared)
    })
    if (match.length == 1) {
        return true
        console.log("match");
    } else {
        return false
        console.log("not a match")
    }
}


app.use(express.static(path.join(__dirname, "public")))
/******LISTEN*********************************/
app.listen(3000, () => {
    console.log("listening to 3000")
    User.find().then((users)=>{
        tempusers = users;
        console.log(tempusers);
    }, (err)=>{
        error: "cannot add to tempusers"
    })
    
    Meme.find().then((memes)=>{
        tempmemes = memes;
        console.log(memes);
    }, (err)=>{
        error: "cannot add to tempmemes"
    })
}) 