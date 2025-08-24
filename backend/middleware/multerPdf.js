// const multer = require("multer");

// // Configure storage for PDFs (store in memory before uploading to Cloudinary)
// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "application/pdf") {
//     cb(null, true); // Accept PDF files
//   } else {
//     cb(new Error("Only PDF files are allowed"), false);
//   }
// };

// const uploadPdf = multer({ storage, fileFilter });

// module.exports = uploadPdf;


const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = uploadPdf;
