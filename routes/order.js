const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Address = require("../models/Address");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");
//
const { cartProductDetailsFunc } = require("../helper/utlis");
//
const { cartDetailsNoProd } = require("../helper/utlis");
//
const { browserUser } = require("../middleware/browserUser");
////////////////////////////////////////////////////////////

///////////cron-jobs to update-- order -- status//////////////

const schedule = require("node-schedule");
const { browserAdmin } = require("../middleware/browserAdmin");

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

//--/order
//frontend

///////////////////////////////////////////////////////
//---/order
//create
router.post("/createOrder", browserUser, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const address = req.body.address || req.body.addressId;
    //
    console.log(address, "address");
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
    ///////////for address//////////////////
    let savedAddressId;
    if (req.body.address) {
      const newAddress = new Address({
        userId: user._id,
        address: address,
      });
      //
      const addressSaved = await newAddress.save();
      //
      savedAddressId = addressSaved._id;
    }
    //
    else if (req.body.addressId) {
      console.log(req.body.addressId, "req.body.addressId>>");
      //
      // const checkingId = mongoose.isValidObjectId(req.body.addressId);

      //
      const addressDetails = await Address.findOne({ _id: req.body.addressId });
      //
      if (!addressDetails) {
        //
        messageArray.push("address not found in array");
        return res.json({ message: messageArray });
      }

      // console.log(addressDetails, "addressDetails");
      //
      savedAddressId = addressDetails._id;
    }
    /////////////////////////////////////////////////

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
      address: savedAddressId,
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

    //
    res.json({ message: messageArray, order: order });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//get your order( for user)

router.get("/getYourOrders", browserUser, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    const user = req.user;
    //
    const orders = await Order.find({ userId: user._id });

    //initializing orderArray
    const ordersArray = [];
    //
    if (orders.length < 1) {
      messageArray.push("this user has no orders");
      //
      // return res.json({ message: messageArray });
      return res.render("order", {
        user: user,
        ordersArray: ordersArray,
        message: messageArray,
      });
    }

    //

    //

    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];

      // console.log(oneOrder, "oneOrder");

      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId address",
      });
      //
      // console.log(orderPopulate, "orderPopulate");

      //
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);

      //

      //

      //adding values to orderFuncValue-- object
      orderFuncValue._id = orderPopulate._id;
      //updated for address
      orderFuncValue.address = orderPopulate.address.address;
      orderFuncValue.status = orderPopulate.status;
      //pushing orderFuncValue object to --- ordersArray
      //
      orderFuncValue.createdAt = orderPopulate.createdAt; //created at
      ordersArray.push(orderFuncValue);
    }
    // console.log(ordersArray, "ordersArray");
    //
    // res.json({ user: user, ordersArray: ordersArray });

    //
    // sorted by latest to- oldest date
    //
    if (ordersArray.length > 1) {
      //
      // sorted by latest to- oldest date
      const sortedOrdersArray = ordersArray.sort(function (a, b) {
        //
        const c = Date.parse(a.createdAt);
        const d = Date.parse(b.createdAt);

        //
        return d - c;
      });
      //
      return res.render("order", {
        user: user,
        ordersArray: sortedOrdersArray,
        message: messageArray,
      });
    }

    //
    res.render("order", {
      user: user,
      ordersArray: ordersArray,
      message: messageArray,
    });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//get one user orders -( as admin)

router.get("/getOneUserOrders/:id", browserAdmin, async (req, res) => {
  //
  const messageArray = [];
  //
  try {
    const paramsId = req.params.id;
    //
    const orders = await Order.find({ userId: paramsId });
    // console.log(orders, "orders");

    //
    if (orders.length < 1) {
      messageArray.push("this user has no orders");

      //hard coding an empty array, no orders( for frontend, no orders by this user in database )
      const ordersArray = [];
      //
      return res.render("adminOnly/oneUserOrders", {
        message: messageArray,
        ordersArray: ordersArray,
      });
    }
    //if has orders
    const ordersArray = [];
    //
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId address",
      });
      //
      //
      const orderFuncValue = await cartProductDetailsFunc(orderPopulate);
      //
      //adding values
      orderFuncValue.address = orderPopulate.address.address;
      orderFuncValue.status = orderPopulate.status;
      ordersArray.push(orderFuncValue);

      // console.log(orderFuncValue.address, "orderFuncValue.address");
      //
      // console.log(ordersArray, "ordersArray");
    }
    //

    //
    res.render("adminOnly/oneUserOrders", { ordersArray: ordersArray });

    //
    // res.json({ ordersArray: ordersArray });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
router.get("/getAllOrders", browserAdmin, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const orders = await Order.find({});

    // console.log(orders, "orders");

    //
    if (orders.length < 1) {
      messageArray.push("no orders found");
      //hard coding an empty array, no orders( for frontend, no orders by this user in database )
      const ordersArray = [];
      //
      return res.json({ message: messageArray, ordersArray: ordersArray });
    }
    //
    const ordersArray = [];
    //
    console.log(orders.length, "orders.length");
    //
    for (let i = 0; i < orders.length; i++) {
      const oneOrder = orders[i];
      //

      //
      //
      const orderPopulate = await Order.populate(oneOrder, {
        path: " userId products.productId address",
      });

      ////if userId, address.. is not null
      //
      if (
        orderPopulate.userId ||
        orderPopulate.address
        //|| orderPopulate.products.productId
      ) {
        // console.log(orderPopulate, "orderPopulate");
        //
        const orderFuncValue = await cartProductDetailsFunc(orderPopulate);
        //

        //adding values
        orderFuncValue.address = orderPopulate.address.address; //address string
        orderFuncValue.status = orderPopulate.status;
        orderFuncValue._id = orderPopulate._id;
        orderFuncValue.createdAt = orderPopulate.createdAt; //created at
        ordersArray.push(orderFuncValue);
      }
    }

    // console.log(ordersArray.length, "ordersArray.length");

    // sorted by latest to- oldest date
    // const sortedOrdersArray = ordersArray.sort(function (a, b) {
    //   //
    //   const c = Date.parse(a.createdAt);
    //   const d = Date.parse(b.createdAt);
    //   //
    //   // console.log(c, "c");
    //   // console.log(d, "d");
    //   //
    //   return d - c;
    // });
    //
    if (ordersArray.length > 1) {
      //
      // sorted by latest to- oldest date
      const sortedOrdersArray = ordersArray.sort(function (a, b) {
        //
        const c = Date.parse(a.createdAt);
        const d = Date.parse(b.createdAt);

        //
        return d - c;
      });
      //
      return res.render("adminOnly/allOrders.ejs", {
        ordersArray: sortedOrdersArray,
      });
    }
    // console.log(sortedOrdersArray, "sortedOrdersArray");
    //
    // res.json({ ordersArray: sortedOrdersArray });
    //
    res.render("adminOnly/allOrders.ejs", { ordersArray: ordersArray });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//would not use in frontend
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
router.get("/getMonthlyIncome", browserAdmin, async (req, res) => {
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
      // console.log(oneOrder.status, "oneOrder.status");

      //ommit canncelled orders
      if (oneOrder.status != "cancelled") {
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

        const monthYearString = splitOrderCreated[1].concat(
          splitOrderCreated[3]
        );
        //
        // console.log(monthYearString, "monthYearString");
        //
        if (!(monthYearString in incomeMonthlyObj)) {
          incomeMonthlyObj[monthYearString] = amountOfOrder;
        }
        //
        else if (monthYearString in incomeMonthlyObj) {
          incomeMonthlyObj[monthYearString] =
            incomeMonthlyObj[monthYearString] + amountOfOrder;
        }
      }
      //
      //
    }

    //
    // all Month Income Total
    let allMonthIncomeTotal = 0;
    for (let key of Object.keys(incomeMonthlyObj)) {
      allMonthIncomeTotal = allMonthIncomeTotal + incomeMonthlyObj[key];
      //
    }

    //
    // res.json({ incomeMonthlyObj: incomeMonthlyObj });
    //

    //
    res.render("adminOnly/monthlyIncome", {
      incomeMonthlyObj: incomeMonthlyObj,
      totalIncome: allMonthIncomeTotal,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
//delete order (as ADMIN)-- reputpuse for status change

router.put("/cancelOrderAsAdmin/:id", browserAdmin, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    const cancelOrder = await Order.findById(req.params.id);
    //
    console.log(cancelOrder, "cancelOrder");
    //
    if (!cancelOrder) {
      messageArray.push("order not found in database");
      return res.json({ message: messageArray });
      //
    } else if (cancelOrder.status == "cancelled") {
      messageArray.push("order is already cancelled");
      //
      return res.json({ message: messageArray, cancelOrder: cancelOrder });
    }
    //
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { status: "cancelled" } },
      { returnOriginal: false }
    );
    //
    messageArray.push("order cancelled");
    res.json({ message: messageArray, cancelOrder: updatedOrder });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
router.put("/cancelOrderAsUser/:id", browserUser, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    const cancelOrder = await Order.findById(req.params.id);
    //
    console.log(cancelOrder, "cancelOrder");
    //
    if (!cancelOrder) {
      messageArray.push("order not found in database");
      return res.json({ message: messageArray });
      //
    } else if (cancelOrder.status == "cancelled") {
      messageArray.push("order is already cancelled");
      //
      return res.json({ message: messageArray, cancelOrder: cancelOrder });
    }
    //
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { status: "cancelled" } },
      { returnOriginal: false }
    );
    //
    messageArray.push("order cancelled");
    res.json({ message: messageArray, cancelOrder: updatedOrder });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
module.exports = router;
