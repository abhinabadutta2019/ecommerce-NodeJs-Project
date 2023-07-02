const mongoose = require("mongoose");

//
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    productLeft: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    imagePath: {
      type: String,
      default: null,
    },
    categories: { type: Array },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
