const catchAsyncError = require("./catchAsyncError");
const errorHandler = require("../utils/Errorhandler");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

// Middleware to check if the user is authenticated
exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  // Check if token exists
  if (!token) {
    return next(new errorHandler("Please login to access this resource", 401));
  }

  try {
    // Verify the token
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    // Find the admin and attach to the request object
    const admin = await Admin.findById(decodeData.id).select("name role"); // Only fetch necessary fields
    if (!admin) {
      return next(
        new errorHandler("Admin not found. Please login again.", 404)
      );
    }

    req.admin = admin;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return next(
        new errorHandler("Token has expired. Please login again.", 401)
      );
    }
    if (error.name === "JsonWebTokenError") {
      return next(new errorHandler("Invalid token. Please login again.", 401));
    }
    // Handle other errors
    return next(
      new errorHandler("Authentication failed. Please login again.", 401)
    );
  }
});

// Middleware to authorize roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the admin's role is allowed
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(
        new errorHandler(
          `Role: ${
            req.admin?.role || "unknown"
          } is not allowed to access this resource`,
          403
        )
      );
    }

    next();
  };
};
