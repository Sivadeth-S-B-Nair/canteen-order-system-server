const { User, UserProfile, UserAddress, sequelize } = require("../models");

const PROFILE_INCLUDE = [
  { model: UserProfile, as: "profile" },
  {
    model: UserAddress,
    as: "addresses",
    seperate:true,
    order: [
      ["is_default", "DESC"],
      ["id", "ASC"],
    ],
  },
];

const safeUser = (user) => {
  const raw = user.toJSON();
  delete raw.password;
  return raw;
};

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, { include: PROFILE_INCLUDE });
  if (!user) {
    const err = new Error("Use not found");
    err.status = 404;
    throw err;
  }
  return safeUser(user);
};

const updateProfile = async (userId, { name, phone, avatarUrl }) => {
  const t =await sequelize.transaction();
  try {
    if (name) {
      await User.update({ name }, { where: { id: userId }, transaction: t });
    }
    const [profile,created] = await UserProfile.findOrCreate({
      where: { userId },
      defaults: { userId, phone: phone || null, avatarUrl: avatarUrl || null },
      transaction: t,
    });
    if (!created) {
      await profile.update(
        {
          phone: phone ?? profile.phone,
          avatarUrl: avatarUrl ?? profile.avatarUrl,
        },
        { transaction: t },
      );
    }
    await t.commit();
    return getProfile(userId);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const addAddress = async (
  userId,
  { label, addressLine, city, state, pincode, phone, isDefault },
) => {
  const t = await sequelize.transaction();
  try {
    if (isDefault) {
      await UserAddress.update(
        { isDefault: false },
        { where: { userId }, transaction: t },
      );
    }

    const address = await UserAddress.create(
      {
        userId,
        label,
        addressLine,
        city,
        state,
        pincode,
        phone,
        isDefault: !!isDefault,
      },
      { transaction: t },
    );

    await t.commit();
    return address;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const updateAddress = async (userId, addressId, updates) => {
  const address = await UserAddress.findOne({
    where: { id: addressId, userId },
  });
  if (!address) {
    const err = new Error("Address not found");
    err.status = 404;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    if (updates.isDefault) {
      await UserAddress.update(
        { isDefault: false },
        { where: { userId }, transaction: t },
      );
    }
    await address.update(updates, { transaction: t });
    await t.commit();
    return address.reload();
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const deleteAddress = async (userId, addressId) => {
  const address = await UserAddress.findOne({
    where: { id: addressId, userId },
  });
  if (!address) {
    const err = new Error("Address not found");
    err.status = 404;
    throw err;
  }
  await address.destroy();
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
};
