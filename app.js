require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Salts and hashes our passwords
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// Create local login strategy to authenticate users using their username and password
passport.use(User.createStrategy());

// Serialize and deserialize is only necessary when using sessions and passportlocalmongoose
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/secrets", function (req, res) {
  // if user is logged in, we render the secrets page
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  // de-authenticating users (essentially ending session)
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/register", function (req, res) {
  // test implementation of authentication
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        // authenticating user using passport if no errors are found. Type of authentication is local
        passport.authenticate("local")(req, res, function () {
          // callback only triggered if authentication is successfull
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  // Using passport to login new user and authenticate them
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
