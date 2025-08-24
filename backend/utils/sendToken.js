
// const sendToken = (admin, statusCode, res) => {
//     const token = admin.getJWTToken();

//     const options = {
//         expires: new Date(
//             Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
//         ),
//         httpOnly: true, // Prevents XSS attacks
//         secure: process.env.NODE_ENV === "production", // Secure only in production
//         sameSite: "None",  // Important for cross-origin cookies
//     };

//     res.status(statusCode)
//       .cookie("token", token, options)
//       .json({
//         success: true,
//         admin,
//         token, // Optional: Token also sent in response
//         name: admin.name,  
//         role: admin.role
//       });
// };

// module.exports = sendToken;


const sendToken = (admin, statusCode, res) => {
  const token = admin.getJWTToken();

  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax", // 🔥 Important fix here
  };

  res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      admin,
      token,
      name: admin.name,
      role: admin.role,
    });
};

module.exports = sendToken;
