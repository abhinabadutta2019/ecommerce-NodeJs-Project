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

//user to see his own cart()--
//cart na thakle ---create cart
//(eta cart button e click korle tokhon create hobe)--
// (already, oi user id te created thakle -- create hobena)

router.get("/createCart", postmanUser, async (req, res) => {
  //
  try {
    const user = req.user;

    //check if user's cart already exists
    const checkUserCart = await Cart.findOne({ userId: user._id });

    //if cart exist show that cart
    if (checkUserCart) {
      return res.json({
        message: "this user's cart already exists",
        cart: checkUserCart,
      });
    }

    //if cart doesn't exists --
    //create and send that cart
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
    ///////////////////////////////////////////////////////////
    //cart na thakle-- aage oi user er cart create hobe???

    const user = req.user;

    //initializing cart
    //checking cart
    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      //
      const newCart = new Cart({
        userId: req.user._id,
      });

      //new cart created
      cart = await newCart.save();
      //
      // return res.json({ cartCreated: cartCreated });

      console.log("cart created successfully-- ");
    }
    //
    //

    // //
    res.json();

    //////////////////////////////////////////////////////

    //count(number) of product to add to cart
    // const quantityToAdd = req.body.quantity || 1;

    // //
    // const product = await Product.findOne({ _id: req.params.id });

    // if (!product) {
    //   return res.json({
    //     message: "product not in database, so cant add to cart",
    //   });
    // }
    // //

    // //get user's cart from , Cart collection
    // const checkUserCart = await Cart.findOne({ userId: user._id });

    // //cart e already thakle--quantity increase hobe(notun kore add hobena)
    // //
    // for (let i = 0; i < checkUserCart.products.length; i++) {
    //   //
    //   const element = checkUserCart.products[i];
    //   //

    //   if (element.productId.toString() == req.params.id) {
    //     // console.log(user._id, "user._id");

    //     //
    //     const presentQuantityIncreased = await Cart.findOneAndUpdate(
    //       {
    //         userId: user._id,
    //         "products.productId": element.productId,
    //       },
    //       { $inc: { "products.$.quantity": quantityToAdd } },
    //       { returnOriginal: false }
    //     );

    //     return res.json({
    //       message: "already present item, quantity increased",
    //       cart: presentQuantityIncreased,
    //     });
    //   }
    // }

    // /////////////////////////////////////////////////////
    // //if item not present already, tokhon etai asbe
    // const updatedCart = await Cart.findOneAndUpdate(
    //   { userId: user._id },
    //   {
    //     $push: {
    //       products: { productId: req.params.id, quantity: quantityToAdd },
    //     },
    //   },
    //   { returnOriginal: false }
    // );

    // //
    // res.json({
    //   message: "new item added to cart",
    //   cart: updatedCart,
    // });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

module.exports = router;
