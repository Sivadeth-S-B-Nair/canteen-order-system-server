const { MenuItem, MenuItemImage,Rating, sequelize } = require("../models");

const IMAGES_INCLUDE = {
  model: MenuItemImage,
  as: "images",
  attributes: ["id", "imageUrl", "displayOrder"],
  separate:true,
  order: [["displayOrder", "ASC"]],
};
const RATINGS_INCLUDE={
  model:Rating,
  as:"ratings",
  attributes:[]
}

const getMenuItems = async (role) => {
  const where = role === "kitchen" ? {} : { isAvailable: true };

  return MenuItem.findAll({
    where,
    attributes: {
      include: [
        [sequelize.fn("AVG", sequelize.col("ratings.rating")), "averageRating"],
        [sequelize.fn("COUNT", sequelize.col("ratings.id")), "ratingCount"],
      ],
    },
    include: [IMAGES_INCLUDE, RATINGS_INCLUDE],
    group: ["MenuItem.id"],
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
