const jwt = require('jsonwebtoken');
const config = require('../config/env');

exports.generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
};

exports.generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
