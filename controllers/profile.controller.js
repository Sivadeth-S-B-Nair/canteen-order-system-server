const profileService = require('../services/profile.service');

const getProfile = async (req, res, next) => {
  try {
    const data = await profileService.getProfile(req.user.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const data = await profileService.updateProfile(req.user.userId, { name, phone, avatarUrl });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const { label, addressLine, city, state, pincode, phone, isDefault } = req.body;
    if (!addressLine) {
      const err = new Error('addressLine is required');
      err.status = 400;
      throw err;
    }
    const address = await profileService.addAddress(req.user.userId, {
      label, addressLine, city, state, pincode, phone, isDefault,
    });
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await profileService.updateAddress(
      req.user.userId,
      req.params.addressId,
      req.body,
    );
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await profileService.deleteAddress(req.user.userId, req.params.addressId);
    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, addAddress, updateAddress, deleteAddress };