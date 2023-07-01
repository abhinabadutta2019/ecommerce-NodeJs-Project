const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//

const User = require("../models/User");
//
const {
  postmanAuthMiddleware,
} = require("../middleware/postmanAuthMiddleware");
//
const { hashPass } = require("../helper/utlis");

//
//create / regester- user
router.post("/register", async (req, res) => {
  //
  try {
    //
    if (req.body.password.length < 3 || req.body.username.length < 3) {
      return res.json({ message: " username or password length is too small" });
    }

    //
    const hashedValue = await hashPass(req.body.password);
    //
    const newUser = new User({
      username: req.body.username,
      password: hashedValue,
    });
    //
    const user = await newUser.save();
    res.json({ user: user, message: "registration success" });
  } catch (err) {
    // console.log(err.code);
    if (err.code == 11000) {
      return res.json({ message: "duplicate username" });
    }
    //
    console.log(err);
    res.json(err);
  }
});

//
router.post("/login", async (req, res) => {
  try {
    // console.log(req.body.username, "req.body.username");
    // console.log(req.body.password, "req.body.password");
    //
    const inputUsername = req.body.username;
    const inputPassword = req.body.password;
    const stringPassword = inputPassword.toString();

    // console.log(stringPassword, "stringPassword");

    //
    const user = await User.findOne({
      username: inputUsername,
    });

    // chaek if username found
    if (!user) {
      return res.json({ message: "Username not in database" });
    }

    // console.log(user, "user");
    const hashedPassFromDB = user.password;

    //
    const match = await bcrypt.compare(stringPassword, hashedPassFromDB);

    //check if password matched
    if (!match) {
      return res.json({ message: "password not matched" });
    }

    // console.log(match, "match");

    // console.log(user, "user");
    //getting payload
    const payload = { _id: user._id.toString() };

    //creating token
    const token = jwt.sign({ payload: payload }, process.env.JWT_SECRET);

    // console.log(token, "token");

    // const decode = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decode.payload._id, "decode.payload.id");

    //setting token
    res.cookie("token", token);

    //
    res.json({ token: token, message: "login success", user: user });
    // res.json()
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/test", postmanAuthMiddleware, (req, res) => {
  //
  try {
    //
    const user = req.user;
    // console.log(token, "token");
    //
    res.json(user);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
