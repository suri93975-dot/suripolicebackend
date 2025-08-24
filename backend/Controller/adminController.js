const Admin = require("../models/adminModel");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/sendToken");
const errorHandler=require("../utils/Errorhandler")



exports.registerAdmin = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists",
      });
    }
  
    // Create new admin (hash password before saving)
    const admin = await Admin.create({
      name,
      email,
      password,
    });
  
    res.status(201).send({
      success: true,
      message: "Admin registered successfully",
      admin,
    });
  });

  
//admin login
exports.login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new errorHandler("Please Enter Email & Password", 400));
    }
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return next(new errorHandler("Invalid email or password", 401));
    }
    const isPasswordMatched = await admin.comparePassword(password);
  
    if (!isPasswordMatched) {
      return next(new errorHandler("Invalid email or password", 401));
    }
  
    sendToken(admin, 200, res);
  });
  
  exports.getAllAdmin = catchAsyncError(async (req, res) => {
    const admins = await Admin.find({});
  
    res.status(200).json({
      success: true,
      admins,
    });
  });
  
  // Delete Admin by ID
  exports.deleteAdmin = catchAsyncError(async (req, res) => {
    const { id } = req.params;
  
    const admin = await Admin.findByIdAndDelete(id);
  
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
  
    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  });
  
  //logout admin
  exports.logout = catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
  
    res.status(200).json({
      success: true,
      message: "Logout",
    });
  });
  
   