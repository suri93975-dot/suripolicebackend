
const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["Form", "Announcement"], 
    required: true 
  }, 
  date: { type: String, required: true },
  pdfFile: { type: String },     
  description: { type: String }, 
},{ timestamps: true });

module.exports = mongoose.model("PDF", pdfSchema);
