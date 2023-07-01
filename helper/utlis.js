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
  console.log(hashedPassword, "--hashedPassword");

  return hashedPassword;
};

//export
module.exports = {
  hashPass,
};
