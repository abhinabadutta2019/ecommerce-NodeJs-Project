const mongoose = require("mongoose");

//
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      unique: true,
    },
    productLeft: {
      type: Number,
      require: true,
    },
    price: {
      type: Number,
      require: true,
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
