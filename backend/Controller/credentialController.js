const Tender = require('../models/tenderModel');
const Credential = require('../models/credentialModel');
const mongoose = require('mongoose');
const fileType = require('file-type');
const cloudinary = require("cloudinary").v2;
const catchAsync = require('../middleware/catchAsyncError');









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



exports.submitCredential = catchAsync(async (req, res) => {
  const { contractorName } = req.body;
  const { tenderId } = req.params; // comes from URL path

  // Validate inputs
  if (!contractorName || !req.file) {
    return res.status(400).json({
      success: false,
      message: 'Contractor name and credential PDF are required.',
    });
  }

  // Validate Tender ID
  if (!mongoose.Types.ObjectId.isValid(tenderId)) {
    return res.status(400).json({ success: false, message: 'Invalid Tender ID' });
  }

  const tender = await Tender.findById(tenderId);
  if (!tender) {
    return res.status(404).json({ success: false, message: 'Tender not found' });
  }

  // Check submission deadline
  if (new Date() > new Date(tender.closingDate)) {
    return res.status(400).json({
      success: false,
      message: 'Submission period has ended for this tender.',
    });
  }

  // File validation
  const fileBuffer = req.file.buffer;
  const fileInfo = await fileType.fromBuffer(fileBuffer);

  if (!fileInfo || fileInfo.mime !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed.',
    });
  }

  // Upload to Cloudinary
  let uploadedPdf;
  try {
    uploadedPdf = await uploadToCloudinary(fileBuffer);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload PDF to Cloudinary.',
      error: err.message,
    });
  }

  // Save credential
  const credential = new Credential({
    tenderId,
    contractorName,
    credentialPdfUrl: uploadedPdf.secure_url,
  });

  await credential.save();

  res.status(201).json({
    success: true,
    message: 'Credential submitted successfully.',
    data: credential,
  });
});






exports.getCredentialsByTender = catchAsync(async (req, res) => {
  const { tenderId } = req.params;

  // Validate tender ID
  if (!mongoose.Types.ObjectId.isValid(tenderId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid tender ID',
    });
  }

  const tender = await Tender.findById(tenderId);
  if (!tender) {
    return res.status(404).json({
      success: false,
      message: 'Tender not found',
    });
  }

  // Restrict access if tender is still open
  if (new Date() < new Date(tender.closingDate)) {
    return res.status(403).json({
      success: false,
      message: 'You can only view credentials after the tender closing date.',
    });
  }

  const credentials = await Credential.find({ tenderId }).sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: credentials.length,
    data: credentials,
  });
});






exports.downloadCredentialPdf = catchAsync(async (req, res, next) => {
  const { credentialId } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(credentialId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Credential ID format.",
    });
  }

  // Fetch credential by ID
  const credential = await Credential.findById(credentialId).populate("tenderId");

  if (!credential || !credential.credentialPdfUrl) {
    return res.status(404).json({
      success: false,
      message: "Credential not found or PDF missing.",
    });
  }

  // Generate a signed URL from Cloudinary (valid for 1 hour)
  const signedUrl = cloudinary.url(credential.credentialPdfUrl, {
    resource_type: "raw",
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  // Return metadata + signed URL
  res.status(200).json({
    success: true,
    pdfUrl: signedUrl,
    contractorName: credential.contractorName,
    tenderId: credential.tenderId?._id,
    tenderTitle: credential.tenderId?.title,
    submittedAt: credential.submittedAt,
  });
});



exports.deleteCredential = catchAsync(async (req, res) => {
  const { credentialId } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(credentialId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Credential ID format.",
    });
  }

  // Find credential
  const credential = await Credential.findById(credentialId);
  if (!credential) {
    return res.status(404).json({
      success: false,
      message: "Credential not found.",
    });
  }

  // Extract public_id from Cloudinary URL
  // Cloudinary URLs look like: https://res.cloudinary.com/<cloud_name>/raw/upload/v1234567890/pdfs/filename.pdf
  const urlParts = credential.credentialPdfUrl.split("/");
  const publicIdWithExt = urlParts.slice(-2).join("/").replace("pdfs/", "pdfs/"); // keep folder path
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extension

  try {
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete file from Cloudinary.",
      error: error.message,
    });
  }

  // Delete from MongoDB
  await Credential.findByIdAndDelete(credentialId);

  res.status(200).json({
    success: true,
    message: "Credential deleted successfully.",
  });
});
