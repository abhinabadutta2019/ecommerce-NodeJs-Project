const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

const cartSchema = new mongoose.Schema(
  {
    //
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        //(eta dile - id debe na)_id:null / false
      },
    ],
  },
  { timestamps: true }
);

//
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
