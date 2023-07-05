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
  const messageArray = [];
  //
  try {
    const user = req.user;

    //check if user's cart already exists
    let cart = await Cart.findOne({ userId: user._id });

    //if cart doesn't exists --

    if (!cart) {
      //create and send that cart
      const newCart = new Cart({
        userId: req.user._id,
      });

      //
      cart = await newCart.save();

      //
      messageArray.push("cart ceated");
    }

    //check if any product in cart
    if (cart.products.length < 1) {
      messageArray.push("cart is empty no product there");
      //
      return res.json({ message: messageArray, cart: cart });
    }
    //

    ////////////////////////////////////////////////////////

    //if item in cart - then populate
    //populate cart
    //populating two path at onece, populating separately
    const cartPopulate = await Cart.populate(cart, {
      path: " userId products.productId ",
    });

    //taking only products array
    const cartProducts = cartPopulate.products;
    //
    let cartArray = [];
    //
    let cartValue = 0;
    //
    for (let i = 0; i < cartProducts.length; i++) {
      const oneProduct = cartProducts[i];

      //
      const prodObj = {
        title: oneProduct.productId.title,
        price: oneProduct.productId.price,
        quantity: oneProduct.quantity,
      };
      //caluculating cart value
      cartValue = cartValue + prodObj.price * prodObj.quantity;
      //
      cartArray.push(prodObj);
    }

    //
    return res.json({
      message: messageArray,
      cartValue: cartValue,
      cart: cartArray,
    });

    /////////////////////////////////////////////////////////////////////////
  } catch (err) {
    if (err.code == 11000) {
      //
      messageArray.push("this user's cart already exists");
      //
      return res.json({ message: messageArray });
    }
    console.log(err);
    res.json(err);
  }
});

//add product to cart

router.put("/addToCart/:id", postmanUser, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
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
      //
      messageArray.push("cart ceated");
    }

    //////////////////////////////////////////////////////

    // count(number) of product to add to cart
    const quantityToAdd = req.body.quantity || 1;

    //
    const product = await Product.findOne({ _id: req.params.id });

    //if product id is present in product collecttion
    if (!product) {
      //
      messageArray.push("product not in database, so cant add to cart");
      return res.json({
        message: messageArray,
      });
    }

    //
    // if database product limit exceeds
    if (quantityToAdd > product.productLeft) {
      //
      messageArray.push("Product limit exceeded, add lower quantity to cart");
      //
      return res.json({
        message: messageArray,
      });
    }

    //cart e already thakle--quantity increase hobe(notun kore add hobena)
    //
    for (let i = 0; i < cart.products.length; i++) {
      //
      const element = cart.products[i];
      //

      if (element.productId.toString() == req.params.id) {
        // console.log(user._id, "user._id");

        //
        const presentQuantityIncreased = await Cart.findOneAndUpdate(
          {
            userId: user._id,
            "products.productId": element.productId,
          },
          { $inc: { "products.$.quantity": quantityToAdd } },
          { returnOriginal: false }
        );

        //
        messageArray.push("already present item, quantity increased");
        //
        return res.json({
          message: messageArray,
          cart: presentQuantityIncreased,
        });
      }
    }

    // /////////////////////////////////////////////////////
    // //if item not present already, tokhon etai asbe
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          products: { productId: req.params.id, quantity: quantityToAdd },
        },
      },
      { returnOriginal: false }
    );
    //
    messageArray.push("new item added to cart");
    //
    res.json({
      message: messageArray,
      cart: updatedCart,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

module.exports = router;
