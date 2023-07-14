const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");

//
const multer = require("../middleware/multer");
const aws = require("../helper/s3");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
//
//create product
//
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

// update imagepath

router.put(
  "/updateImagePath/:id",
  multer.single("file"),
  postmanAdmin,
  async (req, res) => {
    //
    const messageArray = [];
    //
    try {
      //

      //
      const file = req.file;
      //
      if (!file) {
        messageArray.push("no file uploaded");
        return res.json({ message: messageArray });
      }

      //
      const uploadResponse = await aws.uploadFileToS3(file);
      //
      //
      console.log(uploadResponse, "uploadResponse");
      //
      const product = await Product.findById(req.params.id);
      //

      if (!product) {
        messageArray.push("product not present in database");
        return res.json({ message: messageArray });
      }

      res.json();
    } catch (err) {
      console.log(err);
      res.json(err);
    }
  }
);

//delete a product
router.delete("/delete/:id", postmanAdmin, async (req, res) => {
  //
  try {
    //
    // console.log(req.params.id, "req.params.id");
    //
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    //

    if (!deletedProduct) {
      //
      return res.json({
        message: "this product not found in database to delete",
      });
    }

    res.json({ message: "product deleted", deletedProduct: deletedProduct });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//get All Products
router.get("/getAllProducts", postmanUser, async (req, res) => {
  //
  try {
    //
    const allProducts = await Product.find({});

    res.json({ allProducts: allProducts });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/getOneProduct/:id", postmanUser, async (req, res) => {
  //
  try {
    if (!req.params.id) {
      return res.json({ message: "no id passed with params" });
    }
    //
    const product = await Product.findById(req.params.id);
    //
    if (!product) {
      return res.json({ message: "product not found in database" });
    }
    //
    res.json({ product: product });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//catagory
router.get("/productsByCategory/:category", postmanUser, async (req, res) => {
  //

  try {
    //
    const messageArray = [];
    //
    if (!req.params.category) {
      messageArray.push("no category passed with req.params");
      return res.json({ message: messageArray });
    }

    // Find products that match category
    const products = await Product.find({ categories: req.params.category });

    if (products.length < 1) {
      messageArray.push("No products found for this catagory");
      //
      return res.json({ message: messageArray });
    }

    res.json({ products: products });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

// search
router.get("/searchByTitle/:text?", postmanUser, async (req, res) => {
  try {
    //
    // console.log(req.params.text, "req.params.text");
    //
    if (!req.params.text) {
      return res.json({ message: "no text passed with params" });
    }

    // Create a regular expression pattern to perform a case-insensitive search
    const inputText = new RegExp(req.params.text, "i");

    // Find products that match the title search
    const products = await Product.find({ title: inputText });

    if (products.length < 1) {
      return res.json({
        message: "No products found for this search",
      });
    }

    res.json({ products: products });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
module.exports = router;
