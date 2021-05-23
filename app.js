//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(`mongodb+srv://nisarg:${process.env.PASSWORD}@cluster0.x2a77.mongodb.net/courseDB`, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  course: [{
      name: String,
      title: String,
      content: String
    }]
});

const postSchema = new mongoose.Schema({
  name: String,
  title: String,
  content: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

const Post = mongoose.model("Post", postSchema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
    res.render("firstPage");
});

app.get("/login", function(req, res) {
  if(req.isAuthenticated()) {
    if(req.user.role === "teacher") {
      res.render("teacherMainPage");
    } else {
      Post.find({}, function(err, found) {
        if(err) {
          console.log(err);
        } else {
          res.render("studentMainPage", {courses: found});
        }
      });
    }
  } else {
      res.render("login");
  }
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/checkPage", function(req, res) {
  if(req.isAuthenticated()) {
    if(req.user.role === "teacher") {
      res.render("teacherMainPage");
    } else {
      Post.find({}, function(err, found) {
        if(err) {
          console.log(err);
        } else {
          res.render("studentMainPage", {courses: found});
        }
      });
    }
  } else {
    res.redirect("/");
  }
});

app.get("/allCourse", function(req, res) {
  if(req.isAuthenticated()) {
    if(req.user.role === "teacher") {
      res.render("allCourse", {courses: req.user.course});
    }
  } else {
    res.redirect("/");
  }
});

app.get("/posts/:postId", function(req, res) {
  if(req.isAuthenticated()) {
    if(req.user.role === "teacher") {
      res.render("fullView", {courses: req.user.course, postid: req.params.postId});
    } else {
      Post.find({_id: req.params.postId}, function(err, found) {
        if(err) {
          console.log(err);
        } else {
          console.log(found);
          res.render("studentView", {course: found[0]});
        }
      });
    }
  } else {
    res.redirect("/");
  }
});

app.post("/register", function(req, res) {
  User.register({username: req.body.username, role: req.body.option}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/checkPage");
      });
    }
  });
});

app.post("/login", function(req, res) {

const user = new User({
    username: req.body.username,
    password: req.body.password
});

  req.login(user, function(err) {
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/checkPage");
      });
    }
});
});

app.post("/publish", function(req, res) {

  if(req.isAuthenticated()) {
    if(req.user.role === "teacher") {
      User.updateOne({_id: req.user._id}, {$push: {course: {name: req.body.teacherName,title: req.body.postTitle, content: req.body.postBody}}}, function(err) {
        if(err) {
          console.log(err);
        } else {
          Post.create({name: req.body.teacherName, title: req.body.postTitle, content: req.body.postBody}, function(err) {
            if(err) {
              console.log(err);
            } else {
              res.redirect("/allCourse");
            }
          });
        }
      });
    }
  } else {
    res.redirect("/");
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log("server is running on port 3000.");
});
