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
    const cartUserId = cart.userId;
    //
    console.log(cartUserId, "cartUserId");
    //
    const cartProdArray = [];
    let totalAmt = 0;
    //
    for (let i = 0; i < cart.products.length; i++) {
      const oneProd = cart.products[i];

      //
      const getProdObj = {
        productId: oneProd.productId,
        quantity: oneProd.quantity,
      };
      //
      cartProdArray.push(getProdObj);
      //
      //   console.log(oneProd, "oneProd");
      const oneProdPopulated = await Product.populate(oneProd, {
        path: "productId",
      });
      //
      const getProductAmt = oneProdPopulated.productId.price * oneProd.quantity;
      //
      totalAmt = totalAmt + getProductAmt;
    }
    //
    console.log(cartProdArray, "cartProdArray");
    //
    console.log(totalAmt, "totalAmt");
    //
    ////////////////////////////////////////////////
    const newOrder = new Order({
      userId: cartUserId,
      products: cartProdArray,
      amount: totalAmt,
      address: address,
    });
    //
    const order = await newOrder.save();
    //
    if (order) {
      messageArray.push("new order created");
    }
    //
    res.json({ message: messageArray, order: order });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//get your order( for user)

router.get("/getYourOrders", postmanUser, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    const user = req.user;
    //
    const orders = await Order.find({ userId: user._id });
    //

    //
    const ordersArray = [];
    //

    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //
      // console.log(oneOrder, "oneOrder");
      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId ",
      });
      //
      // console.log(orderPopulate, "orderPopulate");
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);
      //
      // console.log(orderFuncValue, "orderFuncValue");
      //
      ordersArray.push(orderFuncValue);
    }
    //
    console.log(ordersArray, "ordersArray");
    //
    res.json({ orders: orders });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
