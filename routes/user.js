const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Address = require("../models/Address");
//
const jwt = require("jsonwebtoken");
//
const { postmanUser } = require("../middleware/postmanUser");
//
const { postmanAdmin } = require("../middleware/postmanAdmin");
//
const { hashPass } = require("../helper/utlis");
//
const { browserUser } = require("../middleware/browserUser");
const { browserAdmin } = require("../middleware/browserAdmin");
//
const multer = require("../middleware/multer");
const aws = require("../helper/s3");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
//

//---/user
//for frontend

//after login - frontend
router.get("/getOwnDetail", browserUser, async (req, res) => {
  //
  try {
    //
    const user = req.user;

    res.render("ownDetails", { user: user });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
//
router.get("/getAllUser", browserAdmin, async (req, res) => {
  try {
    //
    const admin = req.user;
    //
    const getAll = await User.find({});
    // console.log(getAll, "getAll");
    // res.json({ getAllUser: getAll });
    res.render("adminOnly/getAllUser", { getAllUser: getAll });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

///////////////////////////////Backend.................
//
//TODO- create cart --- with reusable fnction-- when user gets created
//
router.put("/updatePassword", browserUser, async (req, res) => {
  //
  try {
    const messageArray = [];
    //
    if (req.body.password.length < 3) {
      messageArray.push("Password is too small");
      return res.json({ message: messageArray });
    }
    //
    const inputValue = req.body.password;
    console.log(inputValue, "inputValue");

    //
    const hashedInputValue = await hashPass(inputValue);
    console.log(
      hashedInputValue,
      "hashedInputValue from /updatePassword route"
    );

    //

    //
    const user = req.user;
    console.log(user.password, "pervious pass");

    //
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedInputValue,
      },
      { new: true }
    );

    //
    messageArray.push("password updated");

    //for logout --- deleting jwt
    const payload = "deleteJwt";
    const token = jwt.sign(payload, `${process.env.JWT_SECRET}`);

    //setting token in browser
    res.cookie("token", token, {
      maxAge: 1,
    });
    ////////////////////////////////////////
    res.json({ updatedUser: updatedUser, message: messageArray });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//delete user
// also deletes all orders , and cart of that user
router.delete("/deleteUser/:id", browserAdmin, async (req, res) => {
  //
  try {
    //
    console.log(req.params.id, "req.params.id");
    //
    const messageArray = [];
    //
    const admin = req.user;
    //

    const userId = req.params.id;

    //delete the cart of that user
    const deleteUserCart = await Cart.findOneAndDelete({ userId: userId });

    console.log(deleteUserCart, "deleteUserCart");

    if (!deleteUserCart) {
      messageArray.push("cart not found");
    }

    const deleteOrder = await Order.deleteMany({
      userId: userId,
    });

    // console.log(deleteOrder, "deleteOrder");

    if (!deleteOrder) {
      messageArray.push("Order unable to delete");
    }

    //
    const deleteAddress = await Address.deleteMany({
      userId: userId,
    });

    if (!deleteAddress) {
      messageArray.push("address unable to delete");
    }

    // console.log(user, "user");
    const deletedUser = await User.findByIdAndDelete(userId);

    //

    //
    //
    messageArray.push("user deleted");
    res.json({
      message: messageArray,
      deletedUser: deletedUser,
      user: admin,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//
router.get("/getOneUser/:id", browserAdmin, async (req, res) => {
  //
  try {
    //
    const messageArray = [];
    //
    console.log(req.params, "req.params");
    //
    if (!req.params.id) {
      //
      messageArray.push("no id passed with params");
      //
      return res.json({ message: messageArray });
    }
    //
    const admin = req.user;
    //
    const oneUser = await User.findById(req.params.id);
    //
    if (!oneUser) {
      messageArray.push("user not found in database");
      return res.json({ message: messageArray });
    }
    //
    res.render("adminOnly/oneUser", { oneUser: oneUser, user: admin });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
//
//update user imagepath

router.put(
  "/updateUserPic",
  multer.single("file"),
  browserUser,
  async (req, res) => {
    //
    try {
      //
      const messageArray = [];

      //
      const user = req.user;
      //
      if (!user) {
        messageArray.push("user not present");
        return res.json(messageArray);
      }
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
      const updatedImage = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { imagePath: uploadResponse.Location },
        },
        { new: true }
      );
      //
      if (!updatedImage) {
        messageArray.push("image not updated");
        return res.json({ message: messageArray });
      }
      //
      messageArray.push("image updated");
      res.json({ updatedImage: updatedImage, message: messageArray });
      //
    } catch (err) {
      console.log(err);
      res.json(err);
    }
  }
);

//
module.exports = router;
