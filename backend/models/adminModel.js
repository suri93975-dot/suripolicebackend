const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter  name"],
  },
  email: {
    type: String,
    required: [true, "Please Enter your email"],
    unique: true,
    validator: [validator.isEmail, " Please Enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be at least 4 characters long "],
    select: false,
  },
  role: {
    type: String,
    default:"user",
  },
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//JWT token
adminSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//compare password
adminSchema.methods.comparePassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);