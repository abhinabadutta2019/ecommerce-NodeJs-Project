const jwt = require("jsonwebtoken");

//

// _id = "64a0344c7a4cddf5b1872cbf";
// username = "goja1";

const payload = { _id: "64a0344c7a4cddf5b1872cbf", username: "goja1" };
//
// const token = jwt.sign({ foo: "bar" }, "shhhhh");
//
const token = jwt.sign({ payload: payload }, "shhhhh");

// console.log(token, "token");

/////////////////decode//////////////////////////
const decoded = jwt.verify(token, "shhhhh");
// console.log(decoded, "decoded");
//
// console.log();
//
const payloadId = decoded.payload._id;
const payloadUsername = decoded.payload.username;
//
console.log(payloadId, "payloadUsername");
console.log(payloadUsername, "payloadUsername");
