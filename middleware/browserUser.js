const mongoose = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
//
const browserUser = async (req, res, next) => {
  try {
    //

    if (!req.cookies.token) {
      next("No token provided");
    }
    //
    //get token -- for browser
    const token = req.cookies.token;

    //
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decode.payload._id, "decode.payload._id -- from middleware");

    const user = await User.findById({ _id: decode.payload._id });

    if (!user) {
      next("user not in database");
    }

    //exporting from middleware to access from route
    req.user = user;
    //
    next();
    //
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//
module.exports = { browserUser };
