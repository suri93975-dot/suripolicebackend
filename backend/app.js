

// const express = require("express");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");

// const privateRoute = require("./routes/privateRoute");
// const publicRoute = require("./routes/publicRoute");

// const app = express();

// // Allowed origins
// const allowedOrigins = [
//   "http://localhost:5173",        // Dev
//   "https://suri.policecoop.in",  // Prod
//   "http://suri.policecoop.in",
// ];

// // CORS config
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.error(`❌ Blocked by CORS: ${origin}`);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
//   credentials: true,
// };

// app.use(cors(corsOptions));
// // ✅ safe preflight handling (no `*` crash)
// // app.options("/*", cors(corsOptions));  

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // Routes
// app.use("/api/v1", privateRoute);
// app.use("/api/v1", publicRoute);

// // Debug root
// app.get("/", (req, res) => {
//   res.json({ message: "Backend server running 🚀" });
// });

// module.exports = app;


const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const privateRoute = require("./routes/privateRoute");
const publicRoute = require("./routes/publicRoute");

const app = express();

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://suri.policecoop.in",  // ← Fixed: removed trailing space
  "http://suri.policecoop.in",
  "https://birbhum.policecoop.in",
  "http://birbhum.policecoop.in",
  "https://birbhum.policecoop.in/",
];

// CORS config
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ Fix: Add size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Routes
app.use("/api/v1", privateRoute);
app.use("/api/v1", publicRoute);

// Debug root
app.get("/", (req, res) => {
  res.json({ message: "Backend server running 🚀" });
});


module.exports = app;



