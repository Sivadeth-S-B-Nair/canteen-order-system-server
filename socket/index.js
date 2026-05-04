const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

let io; // will be set once, used everywhere

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // ── Authentication Middleware ──────────────────────────────────────────────
  // Every socket connection must send a valid access token
  // This runs before the connection is established
  // Same concept as your protect middleware for REST routes
  io.use(async (socket, next) => {
    try {
      // Client sends token in the auth object during connection
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("No token provided"));
      }
      // Verify the token — same as your protect middleware
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      // Attach user info to the socket — available in all event handlers
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next(); // allow connection
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────
  // Runs when a client successfully connects
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User:${socket.userId} | Role:${socket.role}`,
    );
    // Join the correct room based on role
    // Kitchen joins one shared room
    // Each user joins their own private room
    if (socket.role === "kitchen") {
      socket.join("kitchen-room");
      console.log(`Kitchen user ${socket.userId} joined the kitchen-room`);
    } else {
      socket.join(`user-${socket.userId}-room`);
      console.log(`User ${socket.userId} joined user-${socket.userId}-room`);
    }
    // ── Disconnection Handler ──────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });
  return io
};

// getIO is called from controllers to emit events
// This is the key function — controllers don't import io directly
// They call getIO() which returns the singleton instance

const getIO=()=>{
    if(!io){
        throw new Error("Socket.io not initialized")
    }
    return io
}

module.exports={initSocket,getIO}