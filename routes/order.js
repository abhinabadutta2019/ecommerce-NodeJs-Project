const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");
//
const { cartProductDetailsFunc } = require("../helper/utlis");
//
const { cartDetailsNoProd } = require("../helper/utlis");

//
//create

router.post("/createOrder", postmanUser, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const address = req.body.address;
    //
    const user = req.user;
    //
    const cart = await Cart.findOne({ userId: user._id });
    //
    if (cart.products.length < 1) {
      messageArray.push("cart empty, no product to order");
      //
      return res.json({ message: messageArray });
    }
    //
    if (!address) {
      //
      messageArray.push("no address, order cant be created");
      //
      return res.json({ message: messageArray });
    }

    //
    const cartDest = { ...cart._doc };

    //
    // console.log(cartDest, "cartDest");

    //
    const cartUserId = cartDest.userId;
    //
    console.log(cartUserId, "cartUserId");
    //
    const cartProdArray = [];
    //
    for (let i = 0; i < cartDest.products.length; i++) {
      const oneProd = cartDest.products[i];
      //
      console.log(oneProd, "oneProd");
    }

    //
    res.json({ cart: cart });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;