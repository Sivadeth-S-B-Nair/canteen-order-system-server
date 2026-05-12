const menuService = require("../services/menu.service");

const getMenuItems = async (req, res, next) => {
  try {
    const { role, restaurantId: tokenRestaurantId } = req.user;
    const staffRoles = ["kitchen_staff", "restaurant_admin"];
    const restaurantId = staffRoles.includes(role)
      ? tokenRestaurantId
      : parseInt(req.query.restaurantId, 10);
    if(!restaurantId){
        return res.status(400).json({
            success:false,
            message:"restaurantId query param is required for customers"
        })
    }
    const items = await menuService.getMenuItems(role,restaurantId);
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

const addMenuItem = async (req, res, next) => {
  try {
    const restaurantId=req.user.restaurantId
    const imageUrls = (req.files || []).map(
      (file) => `/uploads/menu-items/${file.filename}`,
    );
    const primaryImageUrl = imageUrls[0] || "";
    const item = await menuService.addMenuItem({
      ...req.body,
      imageUrl: primaryImageUrl,
      imageUrls,
      restaurantId
    });
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, message: "Each image must be under 5 MB" });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ success: false, message: "Maximum 10 images allowed" });
    }
    next(err);
  }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const item = await menuService.toggleAvailability(req.params.id,req.user.restaurantId);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenuItems, addMenuItem, toggleAvailability };
