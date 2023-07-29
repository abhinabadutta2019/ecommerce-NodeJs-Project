const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");

//
const multer = require("../middleware/multer");
const aws = require("../helper/s3");
const { browserUser } = require("../middleware/browserUser");
const { browserAdmin } = require("../middleware/browserAdmin");

require("aws-sdk/lib/maintenance_mode_message").suppress = true;

//frontend

//-- / product

//get All Products
router.get("/getAllProducts", browserUser, async (req, res) => {
  //
  try {
    const user = req.user;

    // const allProducts = await Product.find({});

    //used this to sort random
    //size: 3 -- oto gulo item dekhabe
    const allProducts = await Product.aggregate([{ $sample: { size: 3 } }]);

    // res.json({ allProducts: allProducts });
    res.render("allProducts", { allProducts: allProducts, user: user });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

// ( for frontend)
router.get("/getOneProduct/:id", browserUser, async (req, res) => {
  //
  try {
    //

    //
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

    const user = req.user;
    // console.log(user, "user")
    //
    //- user._id

    const userCart = await Cart.findOne({ userId: user._id });
    //
    // console.log(userCart, "userCart");
    const userCartProds = userCart.products;
    //
    // console.log(userCartProds, "userCartProds");

    //
    let getCountInCart = 0;

    //
    userCartProds.forEach((oneItem) => {
      // console.log(oneItem, "oneItem");
      if (oneItem.productId == req.params.id) {
        //
        getCountInCart = getCountInCart + oneItem.quantity;
      }

      // return getCountInCart;
    });

    //
    console.log(getCountInCart, "getCountInCart");

    //
    // res.json({ product: product });
    //
    res.render("getOneProduct", {
      user: user,
      product: product,
      getCountInCart: getCountInCart,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/createProduct", browserAdmin, async (req, res) => {
  //
  try {
    res.render("adminOnly/createProduct");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/updateProduct/:id", browserAdmin, async (req, res) => {
  //
  try {
    res.render("adminOnly/updateProduct");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//-- / product
// backend

//create product
//
router.post(
  "/createProduct",
  multer.single("file"),
  browserAdmin,
  async (req, res) => {
    //
    const messageArray = [];
    try {
      //
      // console.log(req.body.categories, "req.body.categories");

      console.log(req.body, "req.body");

      //
      if (req.body.title.length < 3) {
        messageArray.push("title is too small");
        return res.json({ message: messageArray });
      }
      //
      else if (req.body.categories.length < 3) {
        //
        messageArray.push("categories is too small");
        return res.json({ message: messageArray });
      }
      //

      //
      const file = req.file;
      console.log(file);
      //
      if (!file) {
        messageArray.push("no file uploaded");
        // return res.json({ message: messageArray });
      }
      //

      let newProduct;
      if (req.file) {
        //
        const uploadResponse = await aws.uploadFileToS3(file);

        console.log(uploadResponse.Location, "uploadResponse.Location");
        //
        newProduct = new Product({
          title: req.body.title,
          productLeft: req.body.productLeft,
          price: req.body.price,
          //
          categories: req.body.categories,
          imagePath: uploadResponse.Location,
        });
      } else if (!req.file) {
        newProduct = new Product({
          title: req.body.title,
          productLeft: req.body.productLeft,
          price: req.body.price,
          //
          categories: req.body.categories,
        });
      }
      //

      // console.log(newProduct, "newProduct");
      // const
      //
      const product = await newProduct.save();
      //
      messageArray.push("new product created");
      //
      res.send({
        message: messageArray,
        product: product,
      });
    } catch (err) {
      //

      if (err.code == 11000) {
        messageArray.push("duplicate product title");
        return res.json({ message: messageArray });
      } else if (err._message == "Product validation failed") {
        //
        messageArray.push("Product validation failed");
        return res.json({ message: messageArray });
      }
      console.log(err);
      // console.log(err._message, "err._message");
      res.json(err);
    }
  }
);
/////////////////////////////////

//update all details (except imagepath)
router.put("/update/:id", browserAdmin, async (req, res) => {
  //
  const messageArray = [];
  try {
    console.log(req.body, "req.body");
    //
    const product = await Product.findById(req.params.id);
    //
    if (!product) {
      messageArray.push("product not present in database");
      return res.json({ message: messageArray });
    }

    //

    //
    // let updatedProduct;
    //categories
    if (req.body.categories) {
      //
      const updatedCategories = await Product.findByIdAndUpdate(
        req.params.id,
        {
          categories: req.body.categories,
        },
        { new: true }
      );
      //
      if (updatedCategories) {
        messageArray.push("categories updated");
      }
    }
    //title
    if (req.body.title) {
      //

      // return res.json({ message: messageArray });
      //
      const updatedTitle = await Product.findByIdAndUpdate(
        req.params.id,
        {
          title: req.body.title,
        },
        { new: true }
      );

      if (updatedTitle) {
        messageArray.push("title updated");
      }
    }
    //
    if (req.body.productLeft) {
      //

      // return res.json({ message: messageArray });
      //
      const updatedProductLeft = await Product.findByIdAndUpdate(
        req.params.id,
        {
          productLeft: req.body.productLeft,
        },
        { new: true }
      );

      //if no -data added to input fields
      if (updatedProductLeft) {
        messageArray.push("productLeft updated");
      }
    }
    //
    if (req.body.price) {
      //

      // return res.json({ message: messageArray });
      //
      const updatedPrice = await Product.findByIdAndUpdate(
        req.params.id,
        {
          price: req.body.price,
        },
        { new: true }
      );

      if (updatedPrice) {
        messageArray.push("product price updated");
      }
    }

    //
    if (messageArray.length < 1) {
      //
      messageArray.push("no ducument added in input fiedls ");
    }

    res.json({ message: messageArray });
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
  browserAdmin,
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

      const product = await Product.findById(req.params.id);
      //

      if (!product) {
        messageArray.push("product not present in database");
        return res.json({ message: messageArray });
      }

      //
      const uploadResponse = await aws.uploadFileToS3(file);

      //
      console.log(uploadResponse.Location, "uploadResponse.Location");
      //
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: { imagePath: uploadResponse.Location },
        },
        { new: true }
      );
      //
      messageArray.push("product image updated");
      //

      res.json({ message: messageArray, updatedProduct: updatedProduct });
    } catch (err) {
      console.log(err);
      res.json(err);
    }
  }
);

//delete a product
router.put("/hide/:id", browserAdmin, async (req, res) => {
  //
  try {
    //
    // console.log(req.params.id, "req.params.id");
    //
    // const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    const messageArray = [];
    //
    const hideProduct = await Product.findByIdAndUpdate(
      { _id: req.params.id },
      { $set: { productLeft: 0 } },
      { returnOriginal: false }
    );

    if (!hideProduct) {
      //
      messageArray.push("this product not found in database to hide");
      //
      return res.json({
        message: messageArray,
      });
    }
    //
    messageArray.push("product hidden");
    //
    res.json({ message: messageArray, deletedProduct: hideProduct });
    //
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//catagory
router.get("/productsByCategory/:category", browserUser, async (req, res) => {
  //

  try {
    //
    const messageArray = [];
    //
    const user = req.user;
    //
    //
    if (!req.params.category) {
      messageArray.push("no category passed with req.params");
      return res.json({ message: messageArray });
    }

    // Find products that match category
    const allProducts = await Product.find({ categories: req.params.category });

    if (allProducts.length < 1) {
      messageArray.push("No products found for this catagory");
      //
      // return res.json({ message: messageArray });
      return res.render("allProducts", {
        allProducts: allProducts,
        user: user,
        message: messageArray,
      });
    }

    res.render("allProducts", { allProducts: allProducts, user: user });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

// search
router.get("/searchByTitle/:text?", browserUser, async (req, res) => {
  try {
    //
    const messageArray = [];
    //
    const user = req.user;
    // console.log(req.params.text, "req.params.text");
    //
    // if (!req.params.text) {
    //   //
    //   messageArray.push("no text passed with params");
    //   //
    //   return res.json({ message: messageArray });
    // }

    // Create a regular expression pattern to perform a case-insensitive search
    const inputText = new RegExp(req.params.text, "i");

    // Find products that match the title search
    const allProducts = await Product.find({ title: inputText });

    if (allProducts.length < 1) {
      // return res.json({
      //   message: "No products found for this search",
      // });
      messageArray.push("No products found for this search");
      //
      return res.render("allProducts", {
        allProducts: allProducts,
        user: user,
        message: messageArray,
      });
    }
    //
    res.render("allProducts", { allProducts: allProducts, user: user });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
module.exports = router;
