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
    console.log(req.body.categoriesArray, "req.body.categoriesArray");

    //

    const newProduct = new Product({
      title: req.body.title,
      productLeft: req.body.productLeft,
      price: req.body.price,
      //
      categories: req.body.categoriesArray,
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

//
module.exports = router;
