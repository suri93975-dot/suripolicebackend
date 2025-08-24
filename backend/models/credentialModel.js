
const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  tenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PDF', 
    required: true,
  },
  contractorName: {
    type: String,
    required: true,
  },
  credentialPdfUrl: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Credential', CredentialSchema);
