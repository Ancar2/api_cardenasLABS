const express = require('express');

const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
    mongoIdValidation,
    updateProfileValidation,
    updatePasswordValidation,
    updateUserAdminValidation,
    deleteUserValidation,
} = require('../validators/userValidators');

const router = express.Router();

router.put('/profile', protect, updateProfileValidation, validate, userController.updateUserProfile);
router.put('/password', protect, updatePasswordValidation, validate, userController.updateUserPassword);

router.get('/', protect, admin, userController.getUsers);
router.get('/:id', protect, admin, mongoIdValidation, validate, userController.getUser);
router.put('/:id', protect, admin, updateUserAdminValidation, validate, userController.updateUser);
router.delete('/:id', protect, admin, deleteUserValidation, validate, userController.deleteUser);

module.exports = router;
