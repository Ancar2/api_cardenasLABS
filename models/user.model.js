const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Por favor agrega un nombre'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Por favor agrega un email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
                'Por favor agrega un email válido',
            ],
        },
        password: {
            type: String,
            required: [true, 'Por favor agrega una contraseña'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            select: false,
        },
        emailVerificationExpire: {
            type: Date,
            select: false,
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.methods.getEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(20).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    this.emailVerificationExpire =
        Date.now() + Number(process.env.EMAIL_VERIFICATION_EXPIRE_MS || 24 * 60 * 60 * 1000);

    return verificationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
