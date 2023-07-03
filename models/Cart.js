const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

const cartSchema = new mongoose.Schema(
  {
    //
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

//
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
