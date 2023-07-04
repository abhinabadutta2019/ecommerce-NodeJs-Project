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

router.put("/addToCart/:id", postmanUser, async (req, res) => {
  //
  try {
    // console.log(req.params.id, "req.params.id");

    //count(number) of product to add to cart
    const quantityToAdd = req.body.quantity || 1;

    //
    const product = await Product.findOne({ _id: req.params.id });

    if (!product) {
      return res.json({
        message: "product not in database, so cant add to cart",
      });
    }

    //
    const user = req.user;

    //
    const checkUserCart = await Cart.findOne({ userId: user._id });

    //cart e adready thakle--quantity increase hobe(notun kore add hobena)
    //

    console.log(checkUserCart.products, "checkUserCart.products");

    //
    for (let i = 0; i < checkUserCart.products.length; i++) {
      const element = checkUserCart.products[i];
      //
      //   console.log(element.productId.toString(), "element");
      //
      //

      if (element.productId.toString() == req.params.id) {
        // console.log(user._id, "user._id");

        //
        const cartProd = await Cart.findOneAndUpdate(
          {
            userId: user._id,
            "products.productId": element.productId,
          },
          { $inc: { "products.$.quantity": quantityToAdd } },
          { returnOriginal: false }
        );
        // console.log(cartProd, "cartProd");
      }
    }

    /////////////////////////////////////////////////////
    /////////////////////this works//////////////////
    //bhabo cart e 1ta kore add kobo
    //product id pabo --- req.params.id theke
    //returnOriginal: false -- to get the updated version
    //
    // const updatedCart = await Cart.findOneAndUpdate(
    //   { userId: user._id },
    //   { $push: { products: { productId: req.params.id } } },
    //   { returnOriginal: false }
    // );
    //
    //
    ////try push + set
    //
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          products: { productId: req.params.id, quantity: quantityToAdd },
        },
      },
      { returnOriginal: false }
    );

    /////////////////////////////////////////////////
    // tested populated
    // const checkUserCartPopulate = await Cart.findOne({
    //   userId: user._id,
    // }).populate("userId");

    // console.log(checkUserCartPopulate, "checkUserCartPopulate");
    ////////////////////////////////////////////////

    //
    res.json({ message: "user cart found" });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
