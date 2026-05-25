require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");
const http = require("http");
const { initSocket } = require("./socket");

const authRoutes = require("./routes/auth.routes");
const menuRoutes = require("./routes/menu.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes=require("./routes/payment.routes")
const ratingRoutes=require("./routes/rating.routes")
const adminRoutes=require("./routes/admin.routes")
const restaurantRoutes=require("./routes/restaurant.routes")
const profileRoutes    = require('./routes/profile.routes');  
const analyticsRoutes=require("./routes/analytics.routes")

const restaurantController=require("./controllers/restaurant.controller")

const path = require("path");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// The webhook endpoint inside payment.routes.js uses express.raw() to capture
// the raw body Buffer needed for HMAC verification.
// If express.json() ran first it would consume the body and we'd lose the raw bytes.

app.use("/api/payments",paymentRoutes)

app.use(express.json());
app.use(cookieParser());

app.use("/uploads",express.static(path.join(__dirname,"uploads")))

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ratings",ratingRoutes)
app.use("/api/admin",adminRoutes) 
app.use("/api/restaurant",restaurantRoutes)
app.use('/api/profile',    profileRoutes); 
app.use("/api/analytics",analyticsRoutes)

app.get("/api/restaurants",restaurantController.getPublicRestaurants)

app.use(require("./middlewares/errorHandler"));

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected");

    // app.listen(process.env.PORT,()=>{
    //     console.log(`Server running on port ${process.env.PORT}`);
    // })

    //CHANGED: create HTTP server from Express app
    // Socket.io needs the HTTP server, not the Express app directly
    const httpServer = http.createServer(app);
    //ADDED: initialize Socket.io on the HTTP server
    initSocket(httpServer);
    httpServer.listen(process.env.PORT,()=>{
        console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.log(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
}

startServer();
