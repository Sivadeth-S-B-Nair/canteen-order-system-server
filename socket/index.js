const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Order } = require("../models");
const locationService = require('../services/location.service');

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
      socket.restaurantId = decoded.restaurantId;
      next(); // allow connection
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────
  // Runs when a client successfully connects
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User:${socket.userId} | Role:${socket.role} | Restaurant:${socket.restaurantId}`,
    );
    // Join the correct room based on role
    // Staff joins the restaurant room
    // Each user joins their own private room
    if (socket.role === "kitchen_staff" || socket.role === "restaurant_admin") {
      if (!socket.restaurantId) {
        console.warn(
          `Staff user ${socket.userId} has no restaurantId — not joining kitchen room`,
        );
      } else {
        socket.join(`kitchen-${socket.restaurantId}-room`);
        console.log(
          `${socket.role} ${socket.userId} joined kitchen-${socket.restaurantId}-room`,
        );
      }
    } else if (socket.role === "delivery_agent") {
      // Agents join their personal room to receive delivery assignments.
      // They also join the kitchen room so the admin dashboard stays in sync
      // when the agent marks something as Delivered.
      socket.join(`agent-${socket.userId}-room`);
      console.log(
        `Delivery agent ${socket.userId} joined agent-${socket.userId}-room`,
      );
      joinAgentToActiveOrderRoom(socket);
    } else {
      socket.join(`user-${socket.userId}-room`);
      console.log(`User ${socket.userId} joined user-${socket.userId}-room`);
    }

    // ── join-order-room ────────────────────────────────────────────────────
    // Users call this when they open the order tracking page.
    // We validate that they own the order before letting them in.

    socket.on("join-order-room", async ({ orderId }) => {
      try {
        if (!orderId) return;
        const order = await Order.findOne({
          where: { id: orderId, userId: socket.userId },
        });
        if (!order) {
          socket.emit("error", { message: "Order not found or access denied" });
          return;
        }
        const room = `order-${orderId}-room`;
        socket.join(room);
        console.log(`User ${socket.userId} joined ${room}`);
      } catch (err) {
        console.error("[Socket] join-order-room error:", err.message);
      }
    });

    socket.on("location-update", async ({ latitude, longitude, orderId }) => {
      try {
        if (socket.role !== "delivery_agent") {
          socket.emit("error", {
            message: "Only delivery agents can emit locations updates",
          });
          return;
        }
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) {
          socket.emit("error", { message: "Invalid coordinates" });
          return;
        }
        let verifiedOrderId = null;
        if (orderId) {
          const order = await Order.findOne({
            where: {
              id: orderId,
              assignedAgentId: socket.userId,
              status: "Out for Delivery",
            },
          });
          if (order) {
            verifiedOrderId = order.id;
            // Make sure agent is in the order room
            const orderRoom = `order-${orderId}-room`;
            if (!socket.rooms.has(orderRoom)) {
              socket.join(orderRoom);
              console.log(
                `Agent ${socket.userId} joined ${orderRoom} on location-update`,
              );
            }
          }
        } 
        await locationService.upsertLocation(
          socket.userId,
          verifiedOrderId,
          lat,
          lng,
        );

        const payload = {
          agentId: socket.userId,
          orderId: verifiedOrderId,
          latitude: lat,
          longitude: lng,
          updatedAt: new Date().toISOString(),
        };

        // Broadcast to the order's tracking room (user sees the dot move)
        if (verifiedOrderId) {
          io.to(`order-${verifiedOrderId}-room`).emit(
            "location-update",
            payload,
          );
        }

        // Broadcast to the kitchen/admin room (optional — admins can see fleet)
        if (socket.restaurantId) {
          io.to(`kitchen-${socket.restaurantId}-room`).emit(
            "agent-location-update",
            payload,
          );
        }
      } catch (err) {
        console.error("[Socket] location-update error:", err.message);
        socket.emit("error", { message: "Failed to process location update" });
      }
    });

    // ── Disconnection Handler ──────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });
  return io;
};

// When a delivery agent connects, auto-join them to any active order room.
// This handles reconnects during an active delivery.
async function joinAgentToActiveOrderRoom(socket) {
  try {
    const activeOrder = await Order.findOne({
      where: {
        assignedAgentId: socket.userId,
        status: "Out for Delivery",
      },
      attributes: ["id"],
    });
    if (activeOrder) {
      const room = `order-${activeOrder.id}-room`;
      socket.join(room);
      console.log(`Agent ${socket.userId} auto-joined ${room} on connect`);
    }
  } catch (err) {
    console.error("[Socket] joinAgentToActiveOrderRoom error:", err.message);
  }
}

// getIO is called from controllers to emit events
// This is the key function — controllers don't import io directly
// They call getIO() which returns the singleton instance

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };
