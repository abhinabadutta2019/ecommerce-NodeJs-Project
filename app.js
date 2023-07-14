const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
//
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
//
const app = express();
app.use(express.json());
//cokkie-parser
app.use(cookieParser());
//
//
dotenv.config();

// view engine
app.set("view engine", "ejs");

//this line was vital to show image on frontend
//this is for relative path
app.use("/images", express.static("./images"));

//mongoDB cloud
let uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.te788iv.mongodb.net/ecommerceApp-30-june?retryWrites=true&w=majority`;
//
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//testing cookie
// app.get("/", function (req, res) {
//   //
//   //set req.cookies
//   // req.cookies.title = "abhinabaTesting";
//   // console.log("Cookies: ", req.cookies);

//   const id = "raja1";

//   res.cookie("abhi-cookie", id);

//   console.log(id);

//   res.json({ id: id });
// });

//
app.listen(process.env.PORT, () => {
  console.log(`Server Started at ${process.env.PORT}`);
});

//
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
