const express = require("express");
const {
  registerAdmin,
  login,
  getAllAdmin,
  deleteAdmin,
  logout,
} = require("../Controller/adminController");
const singleUpload = require("../middleware/singleUpload");
const {
  addGalleyImage,
  getAllGalleryImages,
  deleteGalleryImage,
} = require("../Controller/galleryController");
const uploadPdf = require("../middleware/multerPdf");
const { addPdf, deletePdf } = require("../Controller/pdfController");
const { isAuthenticatedUser } = require("../middleware/auth");
const { sendWhatsappMessage } = require("../Controller/smsController");
const {
  createTender,
  getAllTenders,
  getTenderById,
  deleteTender,
  downloadTenderPdf,
} = require("../Controller/tenderController");
const { submitCredential, getCredentialsByTender, downloadCredentialPdf, deleteCredential } = require("../Controller/credentialController");
const { trackVisit, getVisitStats, getTotalVisitorCount } = require("../Controller/visitorController");


const router = express.Router();

// authorizeRoles("admin")
router.route("/registerAdmin").post(isAuthenticatedUser, registerAdmin);
router.route("/login").post(login);
router.route("/admins").get(isAuthenticatedUser, getAllAdmin);
router.route("/deleteAdmin/:id").delete(isAuthenticatedUser, deleteAdmin);
router.route("/logout").get(isAuthenticatedUser, logout);

//gallery
router
  .route("/addImage")
  .post(singleUpload, isAuthenticatedUser, addGalleyImage);
router
  .route("/deleteImage/:id")
  .delete(isAuthenticatedUser, deleteGalleryImage);
router.route("/images").get(getAllGalleryImages);

//pdf
router.route("/addPdf").post(isAuthenticatedUser,uploadPdf.single("pdfFile"), addPdf);
router.route("/deletePdf/:id").delete(isAuthenticatedUser,deletePdf);

//sms
router.route("/sendSms").post(sendWhatsappMessage);

//tender
router
  .route("/createTender")
  .post(isAuthenticatedUser, uploadPdf.single("pdfFile"), createTender);
router.route("/deleteTender/:id").delete(isAuthenticatedUser,deleteTender)
router.route("/downloadTender/:tenderId").get(downloadTenderPdf)




router.route("/getAllTenders").get(getAllTenders);
router.route("/singleTender/:id").get(getTenderById)

//Credential
router.route("/submitCredential/:tenderId").post(uploadPdf.single("credentialPdf"),submitCredential)
router.route("/getAllcredential/:tenderId").get(isAuthenticatedUser,getCredentialsByTender)
router.route("/downloadCredential/:credentialId").get(isAuthenticatedUser,downloadCredentialPdf)
router.route("/deleteCredential/:credentialId").delete(isAuthenticatedUser,deleteCredential)


//visitor 
router.route("/trackVisitor").post(trackVisit)
router.route("/getVisitor").get(getVisitStats)
router.route("/totalVisitCount").get(getTotalVisitorCount)
module.exports = router;
