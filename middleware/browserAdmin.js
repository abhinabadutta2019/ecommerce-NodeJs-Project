const mongoose = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

//
const browserAdmin = async (req, res, next) => {
  //
  try {
    //
    if (!req.cookies.token) {
      next("No token provided");
    }
    //get token -- for browser
    const token = req.cookies.token;

    //
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    //
    const user = await User.findById({ _id: decode.payload._id });
    //
    if (!user) {
      next("user not in database");
    }
    //

    console.log(user.isAdmin, "user.isAdmin");

    if (!user.isAdmin) {
      next("user not Admin");
    }
    //
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
module.exports = { browserAdmin };
