const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");

//create product

router.post("/createProduct", postmanAdmin, async (req, res) => {
  //
  try {
    //
    // console.log(req.body.categories, "req.body.categories");

    const newProduct = new Product({
      title: req.body.title,
      productLeft: req.body.productLeft,
      price: req.body.price,
      //
      categories: req.body.categories,
    });

    //
    const product = await newProduct.save();
    res.json({
      message: "new product created",
      product: product,
    });
  } catch (err) {
    //
    if (err.code == 11000) {
      return res.json({ message: "duplicate product title" });
    }
    console.log(err);
    res.json(err);
  }
});

//update all details (except imagepath)
router.put("/update/:id", postmanAdmin, async (req, res) => {
  //
  try {
    const product = await Product.findById(req.params.id);
    //

    if (!product) {
      return res.json({ message: "product not present in database" });
    }

    //
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    res.json({ updatedProduct: updatedProduct });
  } catch (err) {
    //
    if (err.code == 11000) {
      return res.json({ message: "duplicate product title" });
    }
    console.log(err);
    res.json(err);
  }
});
//
module.exports = router;
