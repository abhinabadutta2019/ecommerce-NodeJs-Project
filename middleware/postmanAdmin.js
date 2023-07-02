const mongoose = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

//
const postmanAdmin = async (req, res, next) => {
  //
  try {
    //
    if (!req.headers.authorization) {
      next("No token provided");
    }
    //
    const token = req.headers.authorization.split(" ")[1];
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
module.exports = { postmanAdmin };
