const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
//
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        _id: false,
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    amount: { type: Number, required: true },
    address: { type: String, required: true },
    status: { type: String, default: "pending" },
  },

  { timestamps: true }
);

//
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

//
