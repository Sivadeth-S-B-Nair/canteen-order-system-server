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
const path = require("path");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/uploads",express.static(path.join(__dirname,"uploads")))

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments",paymentRoutes)
app.use("/api/ratings",ratingRoutes)

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
