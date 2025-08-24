const express = require("express");
const { getAllPdf, getAllForm, getAllAnnouncement, downloadPdf } = require("../Controller/pdfController");

const router = express.Router();


router.route("/getAllPdf").get(getAllPdf)
router.route("/getAllForm").get(getAllForm)
router.route("/getAllAnnouncement").get(getAllAnnouncement)
router.route("/downloadpdf/:pdfId").get(downloadPdf)











module.exports = router;