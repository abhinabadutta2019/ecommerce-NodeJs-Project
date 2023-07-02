const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");
//
const { hashPass } = require("../helper/utlis");

//
router.put("/updatePassword", postmanUser, async (req, res) => {
  //
  try {
    if (req.body.password.length < 3) {
      return res.json({ message: "Password is too small" });
    }
    //
    const inputValue = req.body.password;
    console.log(inputValue, "inputValue");

    //
    const hashedInputValue = await hashPass(inputValue);
    console.log(
      hashedInputValue,
      "hashedInputValue from /updatePassword route"
    );

    //

    //
    const user = req.user;
    console.log(user.password, "pervious pass");

    //
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedInputValue,
      },
      { new: true }
    );

    res.json({ updatedUser: updatedUser });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
//
module.exports = router;
