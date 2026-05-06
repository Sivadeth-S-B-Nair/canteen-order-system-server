const { MenuItem, MenuItemImage } = require("../models");

const IMAGES_INCLUDE = {
  model: MenuItemImage,
  as: "images",
  attributes: ["id", "imageUrl", "displayOrder"],
  order: [["displayOrder", "ASC"]],
};

const getMenuItems = async (role) => {
  if (role === "kitchen") {
    return MenuItem.findAll({
      include: [IMAGES_INCLUDE],
      order: [["category", "ASC"]],
    });
  }
  return MenuItem.findAll({
    where: { isAvailable: true },
    include: [IMAGES_INCLUDE],
    order: [["category", "ASC"]],
  });
};

const addMenuItem = async ({
  name,
  description,
  price,
  category,
  imageUrl,
  imageUrls,
}) => {
  const item = await MenuItem.create({
    name,
    description,
    price,
    category,
    imageUrl,
  });

  if (imageUrls && imageUrls.length > 0) {
    const imageRows = imageUrls.map((url, idx) => ({
      menuItemId: item.id,
      imageUrl: url,
      displayOrder: idx,
    }));
    await MenuItemImage.bulkCreate(imageRows);
  }
  return MenuItem.findByPk(item.id, { include: [IMAGES_INCLUDE] });
};

const toggleAvailability = async (id) => {
  const item = await MenuItem.findByPk(id, { include: [IMAGES_INCLUDE] });
  if (!item) {
    const err = new Error("Menu item not found");
    err.status = 404;
    throw err;
  }
  await item.update({ isAvailable: !item.isAvailable });
  return MenuItem.findByPk(id, { include: [IMAGES_INCLUDE] });
};

module.exports = { getMenuItems, addMenuItem, toggleAvailability };
