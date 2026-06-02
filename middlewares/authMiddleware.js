const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer")) {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Frontend interceptor listens for this exact message
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const verifySuperAdmin = (req, res, next) => {
  if (req.user?.role != "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super admin access only",
    });
  }
  next();
};

const verifyRestaurantAdmin = (req, res, next) => {
  if (req.user.role !== "restaurant_admin") {
    return res.status(403).json({
      success: false,
      message: "Restaurant admin access only",
    });
  }
  if (!req.user.restaurantId) {
    return res.status(403).json({
      success: false,
      message: "No restaurant assigned to this account",
    });
  }
  next();
};

const verifyKitchenStaff = (req, res, next) => {
  if (
    req.user.role !== "kitchen_staff" &&
    req.user.role !== "restaurant_admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Kitchen staff or restaurant admin access required",
    });
  }
  if (!req.user.restaurantId) {
    return res.status(403).json({
      success: false,
      message: "No restaurant assigned to this account",
    });
  }
  next();
};

const verifyDeliveryAgent = (req, res, next) => {
  if (req.user.role !== "delivery_agent") {
    return res.status(403).json({
      success: false,
      message: "Delivery agent access only",
    });
  }
  if (!req.user.restaurantId) {
    return res.status(403).json({
      success: false,
      message: "No restaurant assigned to this account",
    });
  }
  next();
};

module.exports = {
  protect,
  verifySuperAdmin,
  verifyRestaurantAdmin,
  verifyKitchenStaff,
  verifyDeliveryAgent
};
