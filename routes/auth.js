const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
//

const User = require("../models/User");

//

//
const { hashPass } = require("../helper/utlis");

//
//create / regester- user
router.post("/register", async (req, res) => {
  //
  try {
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

    // console.log(user, "user");
    const hashedPassFromDB = user.password;

    // chaek if username found
    if (!user) {
      return res.json({ message: "Username not in database" });
    }
    //
    const match = await bcrypt.compare(stringPassword, hashedPassFromDB);

    //check if password matched
    if (!match) {
      return res.json({ message: "password not matched" });
    }

    console.log(match, "match");

    //
    res.json({ user: user, message: "login success" });
    // res.json()
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
