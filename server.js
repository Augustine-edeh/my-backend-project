require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const express = require("express");
// TODO: double check the need for this FIXME:
const { cookie } = require("express/lib/response");
const db = require("better-sqlite3")("myApp.db");
db.pragma("journal_mode = WAL");

// Database setup here
const createTables = db.transaction(() => {
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING NOT NULL UNIQUE,
    password STRING NOT NULL
    )
    `
  ).run();
});

createTables();
// Databse setup ends here

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(cookieParser());

// Middleware
app.use(function (req, res, next) {
  res.locals.errors = [];

  // try to decode incoming cookie
  try {
    const decoded = jwt.verify(req.cookies.mySimpleApp, process.env.JWTSECRET);
    req.user = decoded;
  } catch (error) {
    req.user = false;
  }

  res.locals.user = req.user;
  console.log(req.user);

  next();
});

// Home route
app.get("/", (req, res) => {
  if (req.user) {
    return res.render("dashboard");
  }

  res.render("homepage");
});

// Login route
app.get("/login", (req, res) => {
  res.render("login");
});
// Logout route
app.get("/logout", (req, res) => {
  res.clearCookie("mySimpleApp");
  res.redirect("/");
});

// Register route (for user Signup)
app.post("/register", (req, res) => {
  const errors = [];

  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";

  req.body.username = req.body.username.trim();

  if (!req.body.username) errors.push("You must a username.");
  if (req.body.username && req.body.username.length < 3)
    errors.push("Username must be at least 3 characters.");
  if (req.body.username && req.body.username.length > 10)
    errors.push("Username can not exceed 10 characters.");
  if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/))
    errors.push("Username can only contain letters and numbers.");

  if (!req.body.password) errors.push("You must a password.");
  if (req.body.password && req.body.password.length < 3)
    errors.push("Password must be at least 12 characters.");
  if (req.body.password && req.body.password.length > 70)
    errors.push("Password can not exceed 70 characters.");

  if (errors.length) {
    return res.render("homepage", { errors });
  }

  // Save the new user into a database

  const salt = bcrypt.genSaltSync(10);
  req.body.password = bcrypt.hashSync(req.body.password, salt);
  const myStatement = db.prepare(
    "INSERT INTO users (username, password) VALUES (?, ?)"
  );

  const result = myStatement.run(req.body.username, req.body.password);

  const lookupStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?");
  const myUser = lookupStatement.get(result.lastInsertRowid);

  // Log the user in by giving them a cookie
  const myTokenValue = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      skyColor: "blue",
      userid: myUser.id,
      username: myUser.username,
    },
    process.env.JWTSECRET
  );

  res.cookie("mySimpleApp", myTokenValue, {
    httpOnlyt: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24, // cookie is valid for 1 day (24 hours)
  });

  res.send("Thank you!");
});

app.listen(3000);
