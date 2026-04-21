const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRE,
    });
};

module.exports = generateToken;
