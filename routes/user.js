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
//TODO- create cart --- with reusable fnction-- when user gets created
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
router.delete("/deleteUser", postmanUser, async (req, res) => {
  //
  try {
    //
    const user = req.user;
    // console.log(user, "user");
    const deletedUser = await User.findByIdAndDelete(user._id);
    //
    res.json({ message: "user deleted", deletedUser: deletedUser });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/getAllUser", postmanAdmin, async (req, res) => {
  try {
    //
    const admin = req.user;
    //
    const getAll = await User.find({});
    // console.log(getAll, "getAll");
    res.json({ getAllUser: getAll });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/getOneUser/:id", postmanAdmin, async (req, res) => {
  //
  try {
    //
    console.log(req.params, "req.params");
    //
    if (!req.params.id) {
      return res.json({ message: "no id passed with params" });
    }
    //
    const admin = req.user;
    //
    const user = await User.findById(req.params.id);
    //
    if (!user) {
      return res.json({ message: "user not found in database" });
    }
    //
    res.json({ user: user });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
