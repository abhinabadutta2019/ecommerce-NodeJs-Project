const bcrypt = require("bcryptjs");

//

// let hashedPassword;

let hashPass = async (passString) => {
  //
  let stringPassword = passString.toString();
  let saltRounds = 10;
  //
  let hashedPassword = await bcrypt.hash(stringPassword, saltRounds);
  console.log(hashedPassword, "--hashedPassword");

  return hashedPassword;
};

//export
module.exports = {
  hashPass,
};
