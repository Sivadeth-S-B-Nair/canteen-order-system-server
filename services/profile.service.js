const { User, UserProfile, UserAddress, sequelize } = require("../models");
const { buildAddressString, geocodeAddress } = require("./geocoding.service");

const PROFILE_INCLUDE = [
  { model: UserProfile, as: "profile" },
  {
    model: UserAddress,
    as: "addresses",
    separate: true,
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
  const t = await sequelize.transaction();
  try {
    if (name) {
      await User.update({ name }, { where: { id: userId }, transaction: t });
    }
    const [profile, created] = await UserProfile.findOrCreate({
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

const resolveCoordinates = async ({
  latitude,
  longitude,
  addressLine,
  city,
  state,
  pincode,
}) => {
  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }

  const addressString = buildAddressString({
    addressLine,
    city,
    state,
    pincode,
  });
  const coords = await geocodeAddress(addressString);
  return coords ?? { latitude: null, longitude: null };
};

const addAddress = async (
  userId,
  {
    label,
    addressLine,
    city,
    state,
    pincode,
    phone,
    isDefault,
    latitude,
    longitude,
  },
) => {
  const coords = await resolveCoordinates({
    latitude,
    longitude,
    addressLine,
    city,
    state,
    pincode,
  });

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
        latitude: coords.latitude,
        longitude: coords.longitude,
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

  const addressTextChanged =
    (updates.addressLine && updates.addressLine !== address.addressLine) ||
    (updates.city && updates.city !== address.city) ||
    (updates.state && updates.state !== address.state) ||
    (updates.pincode && updates.pincode !== address.pincode);

  const clientProvidedCoords =
    updates.latitude !== null && updates.longitude !== null;

  if (addressTextChanged && !clientProvidedCoords) {
    const merged = {
      addressLine: updates.addressLine ?? address.addressLine,
      city: updates.city ?? address.city,
      state: updates.state ?? address.state,
      pincode: updates.pincode ?? address.pincode,
    };
    const coords = await geocodeAddress(buildAddressString(merged));
    if (coords) {
      updates.latitude = coords.latitude;
      updates.longitude = coords.longitude;
    }
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
