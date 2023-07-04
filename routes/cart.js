const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");
//

//create cart(eta cart button e click korle tokhon create hobe), (already, oi user id te created thakle -- create hobena)
router.post("/createCart", postmanUser, async (req, res) => {
  //
  try {
    const user = req.user;

    //check if user's cart already exists
    const checkUserCart = await Cart.findOne({ userId: user._id });
    //

    if (checkUserCart) {
      return res.json({
        message: "this user's cart already exists",
        cart: checkUserCart,
      });
    }

    //
    const newCart = new Cart({
      userId: req.user._id,
    });

    //
    const cart = await newCart.save();

    // console.log(newCart, "newCart");
    //
    res.json({ message: "cart ceated", cart: cart });
  } catch (err) {
    if (err.code == 11000) {
      return res.json({ message: "this user's cart already exists" });
    }
    console.log(err);
    res.json(err);
  }
});

//add product to cart

router.put("/addToCart", postmanUser, (req, res) => {
  //
  try {
    const user = req.user;
    res.json({ message: "user hERE", user: user });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
