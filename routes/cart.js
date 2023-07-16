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
const { cartProductDetailsFunc } = require("../helper/utlis");
//
const { cartDetailsNoProd } = require("../helper/utlis");
const { browserUser } = require("../middleware/browserUser");
//

//user to see his own cart()--
//cart na thakle ---create cart
//(eta cart button e click korle tokhon create hobe)--
// (already, oi user id te created thakle -- create hobena)

router.get("/createCart", browserUser, async (req, res) => {
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

    //////////////////////////////////////////
    //check if any product in cart
    if (cart.products.length < 1) {
      messageArray.push("cart present, but empty no product there");

      //
      // console.log(cart, "cart before");

      //
      const cartPopulating = await Cart.populate(cart, { path: " userId" });
      // my func
      const cartNoProdFunc = await cartDetailsNoProd(cartPopulating);
      //

      // console.log(cart, "cart after");
      //
      return res.json({
        message: messageArray,
        username: cartNoProdFunc.cartOwnerUsername,
        cartValue: cartNoProdFunc.cartValue,
        // cart: cart,
      });
    }
    //

    ////////////////////////////////////////////////////////

    //if item in cart - then populate
    //populate cart
    //populating two path at onece, populating separately
    const cartPopulate = await Cart.populate(cart, {
      path: " userId products.productId ",
    });

    //calling the function -- cartProductDetails()
    const cartFuncValue = await cartProductDetailsFunc(cartPopulate);

    //
    // console.log(cartFuncValue, "cartFuncValue");

    //
    messageArray.push("cart has products");

    //
    return res.render("cart", {
      message: messageArray,
      cartValue: cartFuncValue.cartValue,
      username: cartFuncValue.cartOwnerUsername,
      cart: cartFuncValue.cartArray,
    });
    //
    // return res.json({
    //   message: messageArray,
    //   cartValue: cartFuncValue.cartValue,
    //   username: cartFuncValue.cartOwnerUsername,
    //   cart: cartFuncValue.cartArray,
    // });

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

//
//

//TODO- use find for this
//TODO-user er moddhe -- array of address --- address, pincode, primary name - phone number
//
//TODO- $push, addtoset

//add product to cart

router.put("/addToCart/:id", browserUser, async (req, res) => {
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
    // console.log(cart, "cart- fr");

    //
    //
    const latestCart = await Cart.findOne({ userId: user._id });
    //
    const cartProd = latestCart.products;
    // console.log(cartProd, "cartProd");
    //
    for (let j = 0; j < cartProd.length; j++) {
      const oneCartProd = cartProd[j];

      // oneCartProd.quantity + quantityToAdd
      const latestCountCanBe = oneCartProd.quantity + quantityToAdd;
      //
      console.log(latestCountCanBe, "latestCountCanBe");
      //
      if (oneCartProd.productId.toString() == product._id.toString()) {
        //
        //latestCountCanBe
        if (latestCountCanBe >= product.productLeft) {
          //
          messageArray.push(
            `Product limit exceeded of item - ${product.title}, cant any more of that, add other item`
          );
          //
          return res.json({
            message: messageArray,
          });
        }
      }
    }
    //

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

//remove item from cart

router.put("/removeFromCart/:id", postmanUser, async (req, res) => {
  //
  try {
    const messageArray = [];

    //
    //
    const givenProductId = req.params.id;
    const quantityToRemove = req.body.quantity || 1;

    //first see cart

    const user = req.user;

    //getting the cart
    let cart = await Cart.findOne({ userId: user._id });

    //if product in database

    const productCheck = await Product.findOne({ _id: givenProductId });

    //
    if (!productCheck) {
      messageArray.push("product not in database, so cant remove from cart");
      //
      return res.json({ message: messageArray });
    }

    //check if product in cart
    //if cart.product contains that - id
    //((!) for this)if not present this will return true- if  present, would return false
    if (!cart.products.find((product) => product.productId == givenProductId)) {
      messageArray.push("this product not in , this user's cart");

      //
      //
      return res.json({ message: messageArray });
    }
    ///////////////////////////////////////////////////////////

    //ekan obdhi asche mane -- present ache

    messageArray.push("this product is present , in this user's cart");

    //  check cart er quantity- zero theke kom hoye jacche kina --

    for (let i = 0; i < cart.products.length; i++) {
      const oneProdOfCart = cart.products[i];
      //
      if (oneProdOfCart.productId == givenProductId) {
        // console.log(oneProdOfCart, "oneProdOfCart");

        if (quantityToRemove > oneProdOfCart.quantity) {
          messageArray.push(
            "remove quantity exceeds , product quantity in cart"
          );
          return res.json({ message: messageArray });
        }
        //
        else if (quantityToRemove == oneProdOfCart.quantity) {
          //
          const updatingCart = await Cart.findOneAndUpdate(
            {
              userId: user._id,
            },
            { $pull: { products: { productId: givenProductId } } },
            { returnOriginal: false }
          );

          messageArray.push("removing the total quantity of this given item");
          //
          return res.json({ message: messageArray, cart: updatingCart });
        }
      }
    }

    ///////////////

    //updating
    //-quantityToRemove -- (- ve ) this negetive would decrease
    const updatingCart = await Cart.findOneAndUpdate(
      {
        userId: user._id,
        "products.productId": givenProductId,
      },
      { $inc: { "products.$.quantity": -quantityToRemove } },
      { returnOriginal: false }
    );
    // console.log(gettingIdFromProductArr, "gettingIdFromProductArr");

    //
    messageArray.push(
      "some quantity of product removed, still some remains in cart"
    );

    //

    res.json({ message: messageArray, cart: updatingCart });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

// remove all items from -user's own cart
//
router.put("/removeAllFromCart", postmanUser, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    const user = req.user;
    //
    const cart = await Cart.findOne({ userId: user._id });
    // console.log(cart, "cart");
    //
    //if no item in cart
    //
    if (cart.products.length < 1) {
      messageArray.push("no item in cart, to remove");
      return res.json({ message: messageArray });
    }
    //
    const removeAllProduct = await Cart.findOneAndUpdate(
      { userId: user._id },
      { $set: { products: [] } },
      { returnOriginal: false }
    );
    //
    if (removeAllProduct) {
      messageArray.push("all products removed from cart");
    }

    res.json({ message: messageArray });
    // res.json({ cart: cart });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

///////
//get one users cart (as ADMIN)
router.get("/getOneUserCart/:id", postmanAdmin, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const findUser = req.params.id;

    //
    const cart = await Cart.findOne({ userId: findUser });

    //if not cart
    if (!cart) {
      //
      messageArray.push("no cart found of this userId");
      //
      return res.json({ message: messageArray });
    }

    //check if any product in cart
    if (cart.products.length < 1) {
      //
      messageArray.push("cart present, but empty no product there");

      //
      const cartPopulating = await Cart.populate(cart, { path: " userId" });

      // my func

      const cartNoProdFunc = await cartDetailsNoProd(cartPopulating);

      // console.log(cartNoProdFunc, "cartNoProdFunc");

      //
      return res.json({
        message: messageArray,
        username: cartNoProdFunc.cartOwnerUsername,
        cartValue: cartNoProdFunc.cartValue,
      });
    }

    //populating the cart
    const cartPopulate = await Cart.populate(cart, {
      path: " userId products.productId ",
    });

    //calling the function -- cartProductDetails()

    const cartFuncValue = await cartProductDetailsFunc(cartPopulate);
    // console.log(cartFuncValue, "cartFuncValue");
    //
    res.json({
      cartValue: cartFuncValue.cartValue,
      username: cartFuncValue.cartOwnerUsername,
      cart: cartFuncValue.cartArray,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//get ALL users cart (as ADMIN)

router.get("/getAllUserCarts", postmanAdmin, async (req, res) => {
  //
  try {
    const carts = await Cart.find({});

    let emptyCarts = [];
    let filledCarts = [];
    //

    for (let i = 0; i < carts.length; i++) {
      const oneUserCart = carts[i];
      //
      if (oneUserCart.products.length < 1) {
        //
        const cartPopulating = await Cart.populate(oneUserCart, {
          path: " userId",
        });

        // my func
        const cartNoProdFunc = await cartDetailsNoProd(cartPopulating);
        //
        emptyCarts.push(cartNoProdFunc);
      }
      //
      if (oneUserCart.products.length > 0) {
        //
        const cartPopulate = await Cart.populate(oneUserCart, {
          path: " userId products.productId ",
        });
        //
        const cartFuncValue = await cartProductDetailsFunc(cartPopulate);
        //
        filledCarts.push(cartFuncValue);
      }
    }

    //
    res.json({ filledCarts: filledCarts, emptyCarts: emptyCarts });
  } catch (err) {
    //
    console.log(err);
    res.json(err);
  }
});
//
module.exports = router;
