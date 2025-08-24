const cloudinary = require("cloudinary").v2;

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    console.log("Uploading file to Cloudinary...");
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "notices", // Optional: Specify a folder in Cloudinary
      resource_type: "raw", // Treat the file as raw data (important for PDFs)
    });
    console.log("Cloudinary Upload Result:", result);
    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error.message);
    throw new Error("Failed to upload file to Cloudinary.");
  }
};

module.exports = uploadToCloudinary;