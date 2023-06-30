const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

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
    res.json(user);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
