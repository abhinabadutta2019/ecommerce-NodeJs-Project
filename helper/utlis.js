const bcrypt = require("bcryptjs");

//

// let hashedPassword;

const hashPass = async (passString) => {
  //
  const stringPassword = passString.toString();
  const saltRounds = 10;
  //
  const hashedPassword = await bcrypt.hash(stringPassword, saltRounds);
  //
  console.log(hashedPassword, "--hashedPassword from utils");

  return hashedPassword;
};

//
const cartProductDetailsFunc = async (cartPopulate) => {
  //

  const cartPopulateProd = cartPopulate.products;
  //
  let cartArray = [];
  //
  let cartValue = 0;
  //
  for (let k = 0; k < cartPopulateProd.length; k++) {
    const oneProduct = cartPopulateProd[k];

    // console.log(oneProduct, "oneProduct");

    //
    let prodObj = {
      title: oneProduct.productId.title,
      price: oneProduct.productId.price,
      quantity: oneProduct.quantity,
    };

    //
    //caluculating cart value
    cartValue = cartValue + prodObj.price * prodObj.quantity;
    //
    cartArray.push(prodObj);
  }
  //

  const cartOwnerUsername = cartPopulate.userId.username;
  //

  //
  return {
    cartArray: cartArray,
    cartValue: cartValue,
    cartOwnerUsername: cartOwnerUsername,
  };
};

//export
module.exports = {
  hashPass,
  cartProductDetailsFunc,
};
