const mongoose = require('mongoose');

const TenderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  pdfUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  closingDate: Date,
});

TenderSchema.pre('save', function (next) {
  if (!this.closingDate) {
    const date = new Date(this.createdAt);
    date.setDate(date.getDate() + 10);
    this.closingDate = date;
  }
  next();
});

module.exports = mongoose.model('Tender', TenderSchema);
