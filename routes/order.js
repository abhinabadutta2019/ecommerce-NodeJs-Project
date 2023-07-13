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
////////////////////////////////////////////////////////////

///////////cron-jobs to update-- order -- status//////////////

const schedule = require("node-schedule");

const rule = new schedule.RecurrenceRule();
rule.second = 5;

const job = schedule.scheduleJob(rule, async function () {
  //
  console.log("Hi from node-schedule");
  //
  try {
    const orders = await Order.find({});
    //
    // console.log(orders, "orders");
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //

      // from "pending" to "shipped"
      if (oneOrder.status == "pending") {
        const updatedOneOrder = await Order.findOneAndUpdate(
          { _id: oneOrder._id },
          { $set: { status: "shipped" } },
          { returnOriginal: false }
        );
        //
        console.log(updatedOneOrder, "updatedOneOrder-to-shipped");
        //
      }

      // from "shipped" to "delivered"
      else if (oneOrder.status == "shipped") {
        const updatedOneOrder = await Order.findOneAndUpdate(
          { _id: oneOrder._id },
          { $set: { status: "delivered" } },
          { returnOriginal: false }
        );
        //
        console.log(updatedOneOrder, "updatedOneOrder -to -delivered");
        //
      }
    }
    //
  } catch (err) {
    console.log(err);
  }
  //
});
//
// console.log(job, "job");
//////////////////////////////////////////////////////////
//
//create
//

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
    // console.log(cartUserId, "cartUserId");
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
    // console.log(cartProdArray, "cartProdArray");
    //
    // console.log(totalAmt, "totalAmt");
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
      //
      messageArray.push("new order created");
      //
      //empty the cart -after order successful
      const removeAllProduct = await Cart.findOneAndUpdate(
        { userId: user._id },
        { $set: { products: [] } },
        { returnOriginal: false }
      );
      //
      if (removeAllProduct) {
        messageArray.push(
          "after successful order - all products removed from cart"
        );
      }
      //orderd count - would reduce- product
      //
      for (let j = 0; j < order.products.length; j++) {
        const oneOrder = order.products[j];
        //
        // console.log(oneOrder, "oneOrder");
        const reduceOrderProductCount = await Product.findOneAndUpdate(
          {
            _id: oneOrder.productId,
          },
          { $inc: { productLeft: -oneOrder.quantity } },
          { returnOriginal: false }
        );
        //
        // console.log(reduceOrderProductCount, "reduceOrderProductCount");
        //

        //
        if (reduceOrderProductCount) {
          console.log(reduceOrderProductCount, "reduceOrderProductCount");
          messageArray.push(
            `${reduceOrderProductCount.title}, quantity removed-${oneOrder.quantity} `
          );
        }
      }
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
    if (orders.length < 1) {
      messageArray.push("this user has no orders");
      //
      return res.json({ message: messageArray });
    }

    //
    const ordersArray = [];
    //

    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];

      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId ",
      });

      //
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);

      //adding values
      orderFuncValue.address = oneOrder.address;
      orderFuncValue.status = oneOrder.status;
      ordersArray.push(orderFuncValue);
    }

    //
    res.json({ ordersArray: ordersArray });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//get one user orders -( as admin)

router.get("/getOneUserOrders/:id", postmanAdmin, async (req, res) => {
  //
  const messageArray = [];
  //
  try {
    const paramsId = req.params.id;
    //
    const orders = await Order.find({ userId: paramsId });
    console.log(orders, "orders");
    //
    if (orders.length < 1) {
      messageArray.push("this user has no orders");
      //
      return res.json({ message: messageArray });
    }
    //if has orders
    const ordersArray = [];
    //
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId ",
      });
      //
      //
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);
      //
      //adding values
      orderFuncValue.address = oneOrder.address;
      orderFuncValue.status = oneOrder.status;
      ordersArray.push(orderFuncValue);
    }
    //

    //
    res.json({ ordersArray: ordersArray });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
router.get("/getAllOrders", postmanAdmin, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const orders = await Order.find({});

    //
    if (orders.length < 1) {
      messageArray.push("this user has no orders");
      //
      return res.json({ message: messageArray });
    }
    //
    const ordersArray = [];
    //
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //
      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId ",
      });
      //
      // console.log(orderPopulate, "orderPopulate");
      //
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);
      //

      //adding values
      orderFuncValue.address = orderPopulate.address;
      orderFuncValue.status = orderPopulate.status;
      orderFuncValue._id = orderPopulate._id;
      orderFuncValue.createdAt = orderPopulate.createdAt; //created at
      ordersArray.push(orderFuncValue);
    }

    // sorted by latest to- oldest date
    const sortedOrdersArray = ordersArray.sort(function (a, b) {
      //
      const c = Date.parse(a.createdAt);
      const d = Date.parse(b.createdAt);
      //
      // console.log(c, "c");
      // console.log(d, "d");
      //
      return d - c;
    });
    //
    // console.log(sortedOrdersArray, "sortedOrdersArray");
    //
    res.json({ ordersArray: sortedOrdersArray });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
router.get("/getAllOrdersByUsers", postmanAdmin, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    const orders = await Order.find({});

    //
    if (orders.length < 1) {
      messageArray.push("this user has no orders");
      //
      return res.json({ message: messageArray });
    }
    //

    //
    const oneUserObj = {};
    //
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId ",
      });
      //
      const orderOwner = orderPopulate.userId.username;

      //
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);

      //adding values
      orderFuncValue.address = orderPopulate.address;
      orderFuncValue.status = orderPopulate.status;
      orderFuncValue._id = orderPopulate._id;
      orderFuncValue.createdAt = orderPopulate.createdAt; //created at

      // if key created

      if (orderOwner in oneUserObj) {
        //
        oneUserObj[orderOwner].push(orderFuncValue);
        //
      }
      //if key not created
      else if (!(orderOwner in oneUserObj)) {
        const emptyArray = [];
        //
        emptyArray.push(orderFuncValue);
        oneUserObj[orderOwner] = emptyArray;
      }
      //
    }
    //
    // console.log(oneUserObj, "oneUserObj");
    //
    const outerArray = [];
    //
    for (const [key, value] of Object.entries(oneUserObj)) {
      //
      // const emptyObj = {};
      // emptyObj[key] = value;
      const emptyArray = [];
      console.log(key, value);
      emptyArray.push(key, value);

      //
      // outerArray.push(emptyObj);
    }
    //
    console.log(outerArray, "outerArray");

    //
    res.json({ oneUserObj: oneUserObj });
    // res.json();
  } catch (err) {
    //
    console.log(err);
    res.json(err);
  }
});

//
router.get("/getMonthlyIncome", postmanAdmin, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const orders = await Order.find({});

    // console.log(orders, "orders");
    if (orders.length < 1) {
      messageArray.push("has no orders, to count monthly income");
      //
      return res.json({ message: messageArray });
    }

    //
    const incomeMonthlyObj = {};
    //
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //
      // console.log(oneOrder, "oneOrder");
      //
      const orderCreated = oneOrder.createdAt.toString();
      // console.log(orderCreated, "orderCreated");
      //
      const amountOfOrder = oneOrder.amount;
      // console.log(amountOfOrder, "amountOfOrder");

      //
      const splitOrderCreated = orderCreated.split(" ");
      //
      // console.log(splitOrderCreated, "splitOrderCreated");
      //
      // console.log(splitOrderCreated[1], splitOrderCreated[3]);

      const monthYearString = splitOrderCreated[1].concat(splitOrderCreated[3]);
      //
      console.log(monthYearString, "monthYearString");
      //
      if (!(monthYearString in incomeMonthlyObj)) {
        incomeMonthlyObj[monthYearString] = amountOfOrder;
      }
      //
      else if (monthYearString in incomeMonthlyObj) {
        incomeMonthlyObj[monthYearString] =
          incomeMonthlyObj[monthYearString] + amountOfOrder;
      }

      //
    }
    //
    res.json({ incomeMonthlyObj: incomeMonthlyObj });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
//delete order (as ADMIN)

router.delete("/deleteOrder/:id", postmanAdmin, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    //
    if (!deletedOrder) {
      messageArray.push("order not found in database");
      return res.json({ message: messageArray });
    }
    //
    messageArray.push("order deleted");
    res.json({ message: messageArray, deletedOrder: deletedOrder });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
