const asyncHandler = require('express-async-handler');
const User = require('../models/user.model');
const sendResponse = require('../utils/sendResponse');

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    sendResponse(res, 200, users, 'Listado de usuarios');
});

const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    sendResponse(res, 200, user, 'Usuario encontrado');
});

const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    if (req.body.name !== undefined) {
        user.name = req.body.name;
    }

    if (req.body.email !== undefined) {
        user.email = req.body.email;
    }

    if (req.body.role !== undefined) {
        user.role = req.body.role;
    }

    if (req.body.isActive !== undefined) {
        user.isActive = req.body.isActive;
    }

    const updatedUser = await user.save();

    sendResponse(
        res,
        200,
        {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
        },
        'Usuario actualizado'
    );
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    if (req.query.permanent === 'true') {
        await user.deleteOne();
        sendResponse(res, 200, {}, 'Usuario eliminado permanentemente');
        return;
    }

    user.isActive = false;
    await user.save();
    sendResponse(res, 200, {}, 'Usuario desactivado');
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    if (req.body.name !== undefined) {
        user.name = req.body.name;
    }

    if (req.body.email !== undefined) {
        user.email = req.body.email;
    }

    if (req.body.password) {
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    sendResponse(
        res,
        200,
        {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
        },
        'Perfil actualizado'
    );
});

const updateUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.matchPassword(req.body.currentPassword))) {
        res.status(401);
        throw new Error('Contraseña actual inválida');
    }

    user.password = req.body.newPassword;
    await user.save();

    sendResponse(res, 200, {}, 'Contraseña actualizada');
});

module.exports = {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    updateUserProfile,
    updateUserPassword,
};
