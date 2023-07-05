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

    //get user's cart from , Cart collection
    const checkUserCart = await Cart.findOne({ userId: user._id });

    //cart e already thakle--quantity increase hobe(notun kore add hobena)

    //
    for (let i = 0; i < checkUserCart.products.length; i++) {
      //
      const element = checkUserCart.products[i];
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
        // .populate("userId")
        // .populate("products.productId");
        //

        //
        console.log(presentQuantityIncreased, "presentQuantityIncreased");

        //
        const populatedValue = await Cart.populate(
          presentQuantityIncreased,
          { path: "userId" },
          {
            path: "products.productId",
          }
        );

        console.log(populatedValue, "populatedValue");
        //
        // const cartProducts = presentQuantityIncreased.products;

        // let cartArray = [];
        // //
        // for (let j = 0; j < cartProducts.length; j++) {
        //   const eachProd = cartProducts[j];

        //   //   console.log(eachProd, "eachProd");
        //   const prodObj = {
        //     title: eachProd.productId.title,
        //     quantity: eachProd.quantity,
        //   };
        //   //   console.log(prodObj, "prodObj");
        //   //
        //   cartArray.push(prodObj);
        // }
        //getting car owner value
        // const cartOwner = presentQuantityIncreased.userId.username;
        //
        return res.json({
          message: "already present item, quantity increased",
          // cartOwner: cartOwner,
          // cartArray: cartArray,
          // presentQuantityIncreased: presentQuantityIncreased,
          populatedValue: populatedValue,
        });
      }
    }

    /////////////////////////////////////////////////////
    //if item not present already, tokhon etai asbe
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          products: { productId: req.params.id, quantity: quantityToAdd },
        },
      },
      { returnOriginal: false }
    )
      .populate("userId")
      .populate("products.productId");

    //
    const cartProducts = updatedCart.products;

    // console.log(cartProducts, "cartProducts");
    //

    let cartArray = [];
    //
    for (let k = 0; k < cartProducts.length; k++) {
      const eachProd = cartProducts[k];
      console.log(eachProd, "eachProd");
      //
      const prodObj = {
        title: eachProd.productId.title,
        quantity: eachProd.quantity,
      };
      //
      cartArray.push(prodObj);
    }

    /////////////////////////////////////////////////
    // tested populated
    // const checkUserCartPopulate = await Cart.findOne({
    //   userId: user._id,
    // }).populate("userId");

    // console.log(checkUserCartPopulate, "checkUserCartPopulate");
    ////////////////////////////////////////////////

    //to add cart owner
    const cartOwner = updatedCart.userId.username;
    //
    res.json({
      message: "new item added to cart",
      cartOwner: cartOwner,
      cart: cartArray,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
