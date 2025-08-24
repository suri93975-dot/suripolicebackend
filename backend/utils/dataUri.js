const DatauriParser = require('datauri/parser');
const path = require('path');

const parser = new DatauriParser();

/**
 * Convert a file buffer to a Data URI.
 * @param {Object} file - The file object, usually passed by multer.
 * @returns {string} - The Data URI string for the file.
 */
const getDataUri = (file) => {
  const extName = path.extname(file.originalname).toString(); // Get the file extension
  return parser.format(extName, file.buffer).content; // Convert buffer to Data URI
};

module.exports = getDataUri;
