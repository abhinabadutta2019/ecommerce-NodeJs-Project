const mongoose = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
//
const postmanAuthMiddleware = async (req, res, next) => {
  try {
    //

    if (!req.headers.authorization) {
      next("No token provided");
    }
    //
    // console.log(req.headers.authorization, "req.headers.authorization---from ");
    // get token -- for postman
    const token = req.headers.authorization.split(" ")[1];

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
module.exports = { postmanAuthMiddleware };
