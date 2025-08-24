const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  description: {
    type: String,
  },
   galleryImage:{ //secure url
   type:String,
   required:[true]
  },
  galleryPublicUrl:{
    type:String,
    required:[true]
  }
},{ timestamps: true });

module.exports = mongoose.model("Gallery", gallerySchema);