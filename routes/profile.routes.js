const express           = require('express');
const router            = express.Router();
const profileController = require('../controllers/profile.controller');
const { protect }       = require('../middlewares/authMiddleware');

router.get('/',                          protect, profileController.getProfile);
router.put('/',                          protect, profileController.updateProfile);
router.post('/addresses',                protect, profileController.addAddress);
router.put('/addresses/:addressId',      protect, profileController.updateAddress);
router.delete('/addresses/:addressId',   protect, profileController.deleteAddress);

module.exports = router;