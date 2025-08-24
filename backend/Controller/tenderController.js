const Tender = require("../models/tenderModel");
const catchAsync = require("../middleware/catchAsyncError");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fileType = require("file-type");
const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "pdfs" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

exports.createTender = catchAsync(async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || "";
    const closingDateInput = req.body.closingDate;
    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required." });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "PDF file is required." });
    }
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (req.file.size > MAX_FILE_SIZE) {
      return res
        .status(400)
        .json({
          success: false,
          message: "PDF file size should not exceed 5MB.",
        });
    }
    const fileBuffer = req.file.buffer;
    const fileInfo = await fileType.fromBuffer(fileBuffer);
    if (!fileInfo || fileInfo.mime !== "application/pdf") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid file type. Only PDF files are allowed.",
        });
    }
    let pdfUrl = "";
    try {
      const cloudinaryResult = await uploadToCloudinary(
        fileBuffer,
        "raw",
        "tenders"
      );
      pdfUrl = cloudinaryResult.secure_url;
      console.log("Tender PDF uploaded to Cloudinary:", pdfUrl);
    } catch (error) {
      console.error("Cloudinary upload error:", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to upload PDF to Cloudinary.",
        });
    }
    if (!closingDateInput) {
      return res
        .status(400)
        .json({ success: false, message: "Closing date is required." });
    }
    const parsedDate = new Date(closingDateInput);
    const now = new Date();
    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid closing date format." });
    }
    if (parsedDate < now.setHours(0, 0, 0, 0)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Closing date cannot be in the past.",
        });
    }
    const tender = new Tender({
      title,
      description,
      pdfUrl,
      closingDate: parsedDate,
    });
    await tender.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Tender created successfully!",
        data: tender,
      });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "An unexpected error occurred.",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
  }
});

// Get All Tenders (with optional pagination and filtering)
exports.getAllTenders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const onlyActive = req.query.active === "true"; // optional ?active=true
  const filter = onlyActive ? { closingDate: { $gte: new Date() } } : {};

  const [tenders, total] = await Promise.all([
    Tender.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Tender.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: tenders.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: tenders,
  });
});

exports.getTenderById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tender ID",
    });
  }

  const tender = await Tender.findById(id);

  if (!tender) {
    return res.status(404).json({
      success: false,
      message: "Tender not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Tender fetched successfully",
    data: tender,
  });
});

exports.deleteTender = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tender ID",
    });
  }

  const deletedTender = await Tender.findByIdAndDelete(id);

  if (!deletedTender) {
    return res.status(404).json({
      success: false,
      message: "Tender not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Tender deleted successfully",
    data: deletedTender,
  });
});

exports.downloadTenderPdf = catchAsync(async (req, res, next) => {
  const { tenderId } = req.params;

  // Find the Tender by ID
  const tender = await Tender.findById(tenderId);

  // Check if tender exists and has a PDF public ID
  if (!tender || !tender.pdfUrl) {
    return res.status(404).json({
      success: false,
      message: "Tender not found or PDF not available.",
    });
  }

  // Generate signed Cloudinary URL (valid for 1 hour)
  const signedUrl = cloudinary.url(tender.pdfUrl, {
    resource_type: "raw", // Ensure it's for non-image files
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  });

  // Respond with the signed PDF URL and metadata
  res.status(200).json({
    success: true,
    pdfUrl: signedUrl,
    title: tender.title,
    description: tender.description,
    createdAt: tender.createdAt,
    closingDate: tender.closingDate,
  });
});

// const Tender = require('../models/tenderModel');
// const catchAsync = require('../middleware/catchAsyncError');
// const mongoose = require('mongoose');
// const cloudinary = require("cloudinary").v2;
// const fileType = require("file-type");

// // Configure Cloudinary (should be in app.js, but included here for completeness)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Improved Cloudinary upload helper
// const uploadToCloudinary = (fileBuffer, folder = "tenders") => {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         resource_type: "raw",
//         folder,
//         allowed_formats: ["pdf"],
//         format: "pdf"
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     );
//     uploadStream.end(fileBuffer);
//   });
// };

// // Create Tender
// exports.createTender = catchAsync(async (req, res) => {
//   const { title, description, closingDate: closingDateInput } = req.body;

//   // Validation
//   if (!title?.trim()) {
//     return res.status(400).json({
//       success: false,
//       message: "Title is required."
//     });
//   }

//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "PDF file is required."
//     });
//   }

//   // File validation
//   const MAX_SIZE = 5 * 1024 * 1024; // 5MB
//   if (req.file.size > MAX_SIZE) {
//     return res.status(400).json({
//       success: false,
//       message: "PDF file size should not exceed 5MB."
//     });
//   }

//   // MIME type validation
//   const fileInfo = await fileType.fromBuffer(req.file.buffer);
//   if (!fileInfo || fileInfo.mime !== "application/pdf") {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid file type. Only PDF files are allowed."
//     });
//   }

//   // Cloudinary upload
//   let cloudinaryResult;
//   try {
//     cloudinaryResult = await uploadToCloudinary(req.file.buffer);
//   } catch (error) {
//     console.error("Cloudinary upload error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to upload PDF to Cloudinary."
//     });
//   }

//   // Date validation
//   if (!closingDateInput) {
//     return res.status(400).json({
//       success: false,
//       message: "Closing date is required."
//     });
//   }

//   const closingDate = new Date(closingDateInput);
//   const now = new Date();
//   now.setHours(0, 0, 0, 0); // Set to start of day

//   if (isNaN(closingDate.getTime())) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid closing date format."
//     });
//   }

//   if (closingDate < now) {
//     return res.status(400).json({
//       success: false,
//       message: "Closing date cannot be in the past."
//     });
//   }

//   // Create tender with public_id
//   const tender = await Tender.create({
//     title: title.trim(),
//     description: description?.trim() || "",
//     pdfUrl: cloudinaryResult.secure_url,
//     pdfPublicId: cloudinaryResult.public_id,
//     closingDate
//   });

//   res.status(201).json({
//     success: true,
//     message: "Tender created successfully!",
//     data: tender
//   });
// });

// // Get All Tenders
// exports.getAllTenders = catchAsync(async (req, res) => {
//   const MAX_LIMIT = 100; // Prevent DoS attacks
//   const page = parseInt(req.query.page) || 1;
//   const limit = Math.min(parseInt(req.query.limit) || 20, MAX_LIMIT);
//   const skip = (page - 1) * limit;

//   const onlyActive = req.query.active === 'true';
//   const filter = onlyActive ? { closingDate: { $gte: new Date() } } : {};

//   const [tenders, total] = await Promise.all([
//     Tender.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(),
//     Tender.countDocuments(filter)
//   ]);

//   res.status(200).json({
//     success: true,
//     count: tenders.length,
//     total,
//     page,
//     totalPages: Math.ceil(total / limit),
//     data: tenders,
//   });
// });

// // Get Single Tender
// exports.getTenderById = catchAsync(async (req, res) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Invalid tender ID'
//     });
//   }

//   const tender = await Tender.findById(id).lean();

//   if (!tender) {
//     return res.status(404).json({
//       success: false,
//       message: 'Tender not found'
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: tender
//   });
// });

// // Delete Tender
// exports.deleteTender = catchAsync(async (req, res) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Invalid tender ID'
//     });
//   }

//   const tender = await Tender.findByIdAndDelete(id);

//   if (!tender) {
//     return res.status(404).json({
//       success: false,
//       message: 'Tender not found'
//     });
//   }

//   // Delete from Cloudinary
//   if (tender.pdfPublicId) {
//     try {
//       await cloudinary.uploader.destroy(tender.pdfPublicId, {
//         resource_type: "raw"
//       });
//       console.log(`Deleted from Cloudinary: ${tender.pdfPublicId}`);
//     } catch (error) {
//       console.error("Cloudinary deletion error:", error.message);
//       // Don't fail the request, just log
//     }
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Tender deleted successfully'
//   });
// });

// // Download PDF
// exports.downloadTenderPdf = catchAsync(async (req, res) => {
//   const { tenderId } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(tenderId)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Invalid tender ID'
//     });
//   }

//   const tender = await Tender.findById(tenderId);

//   if (!tender || !tender.pdfPublicId) {
//     return res.status(404).json({
//       success: false,
//       message: "Tender not found or PDF not available."
//     });
//   }

//   // Generate signed URL valid for 15 minutes
//   const signedUrl = cloudinary.url(tender.pdfPublicId, {
//     resource_type: "raw",
//     secure: true,
//     sign_url: true,
//     expires_at: Math.floor(Date.now() / 1000) + 900 // 15 minutes
//   });

//   res.status(200).json({
//     success: true,
//     pdfUrl: signedUrl,
//     title: tender.title,
//     description: tender.description,
//     createdAt: tender.createdAt,
//     closingDate: tender.closingDate
//   });
// });
