const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//

const User = require("../models/User");
const Cart = require("../models/Cart");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");
//
const { hashPass } = require("../helper/utlis");

//---/auth

//frontend routes

//
router.get("/register", async (req, res) => {
  try {
    res.render("withoutToken/register");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
//login page for frontend
router.get("/login", async (req, res) => {
  try {
    res.render("withoutToken/login");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

////////////////////////////////////////////////////////////
//create / regester- user
router.post("/register", async (req, res) => {
  const messageArray = [];

  //
  try {
    //
    if (req.body.password.length < 3 || req.body.username.length < 3) {
      //
      messageArray.push(" username or password length is too small");
      //
      return res.json({ message: messageArray });
    }

    //
    const hashedValue = await hashPass(req.body.password);
    //
    const newUser = new User({
      username: req.body.username,
      password: hashedValue,
      //
      isAdmin: req.body.isAdmin,
    });
    //
    const user = await newUser.save();

    ////////////////////////

    //create cart for new user

    const newCart = new Cart({
      userId: user._id,
    });
    //
    const cart = await newCart.save();
    //
    messageArray.push("cart ceated");
    //////////////////////////////////////
    //
    //getting payload
    const payload = { _id: user._id.toString() };
    //
    const token = jwt.sign({ payload: payload }, process.env.JWT_SECRET);
    //
    //setting token in browser
    res.cookie("token", token);
    //
    messageArray.push("registration success");
    //
    res.json({ token: token, message: messageArray, user: user, cart: cart });
  } catch (err) {
    // console.log(err.code);
    if (err.code == 11000) {
      //
      messageArray.push("duplicate username");
      //
      return res.json({ message: messageArray });
    }
    //
    console.log(err);
    res.json(err);
  }
});

//
router.post("/login", async (req, res) => {
  try {
    //
    const messageArray = [];
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
      messageArray.push("Username not in database");
      //
      return res.json({ message: messageArray });
    }

    // console.log(user, "user");
    const hashedPassFromDB = user.password;

    //
    const match = await bcrypt.compare(stringPassword, hashedPassFromDB);

    //check if password matched
    if (!match) {
      messageArray.push("password not matched");
      //
      return res.json({ message: messageArray });
    }

    // console.log(match, "match");

    // console.log(user, "user");
    //getting payload
    const payload = { _id: user._id.toString() };

    //creating token
    const token = jwt.sign({ payload: payload }, process.env.JWT_SECRET);

    //setting token in browser
    res.cookie("token", token);

    //
    messageArray.push("login success");

    //
    res.json({ token: token, message: messageArray, user: user });
    // res.json()
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/logout", async (req, res) => {
  //
  try {
    //
    const payload = "deleteJwt";
    const token = jwt.sign(payload, `${process.env.JWT_SECRET}`);
    res.cookie("token", token, {
      maxAge: 1,
    });
    //
    res.redirect("login");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//test route to check- login
router.get("/test", postmanAdmin, (req, res) => {
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
