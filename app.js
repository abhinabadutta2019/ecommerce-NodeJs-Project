const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

//
const authRoutes = require("./routes/auth");
//
const app = express();
app.use(express.json());

//
dotenv.config();

//mongoDB cloud
let uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.te788iv.mongodb.net/ecommerceApp-30-june?retryWrites=true&w=majority`;
//
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//
app.listen(process.env.PORT, () => {
  console.log(`Server Started at ${process.env.PORT}`);
});

//
app.use("/auth", authRoutes);
