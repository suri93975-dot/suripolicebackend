const app=require("./app");

const dotenv=require("dotenv")
const connectDataBase = require("./config/database");
const cloudinary = require("cloudinary").v2;


dotenv.config({path:"backend/config/config.env"});


//database
connectDataBase()



// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



// Home Route (Debugging)
app.get("/", async (req, res) => {
    try {
      res.status(200).json({ msg: "I am in home route" });
    } catch (error) {
      res.status(500).json({ msg: "Error in home route" });
    }
  });

// Start Server
const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
  });


// Handling Uncaught Exceptions
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down server due to Uncaught Exception");
    process.exit(1);
  });


// Handling Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down server due to Unhandled Promise Rejection");
  
    server.close(() => {
      process.exit(1);
    });
  });