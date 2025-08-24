const PDF = require("../models/fromModel");
const cloudinary = require("cloudinary").v2;
const catchAsyncError = require("../middleware/catchAsyncError");
const fileType = require("file-type"); // ✅ Compatible with CommonJS
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

exports.addPdf = catchAsyncError(async (req, res, next) => {
  try {
    const { title, type, date, description } = req.body;

    // Validate required fields
    if (!title || !type || !date) {
      return res.status(400).json({
        success: false,
        message: "Title, type, and date are required.",
      });
    }

    if (!["Form", "Announcement"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type value. Must be 'Form' or 'Announcement'.",
      });
    }

    // Handle file upload (optional)
    let pdfFile = "";
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileInfo = await fileType.fromBuffer(fileBuffer); // ✅ Works now

      if (!fileInfo || fileInfo.mime !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only PDFs are allowed.",
        });
      }

      try {
        const cloudinaryResult = await uploadToCloudinary(fileBuffer);
      
        pdfFile = cloudinaryResult.secure_url;
      } catch (error) {
        console.error("Cloudinary upload error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Failed to upload to Cloudinary.",
        });
      }
    }

    // Save to Database
    const newPdf = new PDF({
      title,
      type,
      date,
      pdfFile,
      description,
    });

    await newPdf.save();
   

    res.status(201).json({
      success: true,
      message: "PDF entry added successfully!",
      data: newPdf,
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
      error: error.message,
    });
  }
});




// Helper function for paginated response
const getPaginatedResponse = async (filter, page, limit) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    PDF.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PDF.countDocuments(filter),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
};

// GET all pdf
exports.getAllPdf = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await getPaginatedResponse({}, page, limit);

  res.status(200).json({
    success: true,
    message: "All PDFs fetched successfully.",
    ...result,
  });
});

// GET all form
exports.getAllForm = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await getPaginatedResponse({ type: "Form" }, page, limit);

  res.status(200).json({
    success: true,
    message: "Forms fetched successfully.",
    ...result,
  });
});


// GET all announcements (for infinite scroll)
exports.getAllAnnouncement = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  // Sort latest announcements first
  const announcements = await PDF.find({ type: "Announcement" })
    .sort({ date: -1 }) // or { createdAt: -1 }
    .skip(skip)
    .limit(limit);

  const total = await PDF.countDocuments({ type: "Announcement" });

  res.status(200).json({
    success: true,
    message: "Announcements fetched successfully.",
    data: announcements,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});


exports.downloadPdf = catchAsyncError(async (req, res, next) => {
  const { pdfId } = req.params;

  // Find PDF document by ID
  const pdfDoc = await PDF.findById(pdfId);

  // Check if PDF exists and has a file
  if (!pdfDoc || !pdfDoc.pdfFile) {
    return res.status(404).json({
      success: false,
      message: "PDF not found.",
    });
  }

  // Generate a signed URL from Cloudinary (valid for 1 hour)
  const pdfUrl = cloudinary.url(pdfDoc.pdfFile, {
    resource_type: "raw", // Important for non-image files
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour in seconds
  });

  // Respond with the URL
  res.status(200).json({
    success: true,
    pdfUrl,
    title: pdfDoc.title,
    type: pdfDoc.type,
    date: pdfDoc.date,
    description: pdfDoc.description,
    createdAt: pdfDoc.createdAt,
  });
});




// DELETE PDF
exports.deletePdf = catchAsyncError(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid PDF ID format.",
    });
  }

  const pdfDoc = await PDF.findById(id);
  if (!pdfDoc) {
    return res.status(404).json({
      success: false,
      message: "PDF not found.",
    });
  }

  // Optional: delete from Cloudinary if a file exists
  if (pdfDoc.pdfFile) {
    try {
      // Extract Cloudinary public_id (you can also store this separately in DB if preferred)
      const fileUrl = pdfDoc.pdfFile;
      const filename = fileUrl.split("/").pop(); // e.g., "abc123.pdf"
      const publicId = `notices/${filename.split(".")[0]}`; // assumes uploaded to "notices/" folder

      await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });
    } catch (cloudErr) {
      console.warn("Cloudinary deletion failed:", cloudErr.message);
      // continue deletion in DB
    }
  }

  await pdfDoc.deleteOne();

  res.status(200).json({
    success: true,
    message: "PDF deleted successfully.",
  });
});
