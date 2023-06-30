const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

//
//create / regester- user
router.post("/register", async (req, res) => {
  //
  try {
    //
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
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
