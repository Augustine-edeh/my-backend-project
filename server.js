const express = require("express");
const db = require("better-sqlite3")("myApp.db");
db.pragma("journal_mode = WAL");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(function (req, res, next) {
  res.locals.errors = [];
  next();
});

// Home route
app.get("/", (req, res) => {
  res.render("homepage");
});

// Login route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", (req, res) => {
  const errors = [];

  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";

  req.body.username = req.body.username.trim();

  if (!req.body.username) errors.push("You must a username.");
  if (req.body.username && req.body.username.length < 3)
    errors.push("Username must be at least 3 characters.");
  if (req.body.username && req.body.username.length < 10)
    errors.push("Username can not exceed 10 characters.");
  if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/))
    errors.push("Username can only contain letters and numbers.");

  if (!req.body.password) errors.push("You must a password.");
  if (req.body.password && req.body.password.length < 3)
    errors.push("Password must be at least 12 characters.");
  if (req.body.password && req.body.password.length < 70)
    errors.push("Password can not exceed 70 characters.");

  if (errors.length) {
    return res.render("homepage", { errors });
  }

  // Save the new user into a database

  // Log thr user in by giving them a cookie
});

app.listen(3000);
