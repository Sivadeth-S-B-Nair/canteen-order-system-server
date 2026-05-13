const jwt = require("jsonwebtoken");
const { RefreshToken } = require("../models");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, //process.env.NODE_ENV === 'production',
  sameSite: "lax", //'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateAccessToken = (userId, role, restaurantId = null) => {
  return jwt.sign(
    { userId, role, restaurantId },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "30m",
    },
  );
};

const generateRefreshToken = (userId, role, restaurantId=null) => {
  return jwt.sign(
    { userId, role, restaurantId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.status = 401;
    throw err;
  }
};

const saveRefreshToken = async (userId, token, userAgent) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return RefreshToken.create({
    userId,
    token,
    userAgent: userAgent || "unknown",
    expiresAt,
  });
};

const findRefreshToken = async (token) => {
  return RefreshToken.findOne({ where: { token } });
};

const rotateRefreshToken = async (oldToken, newToken) => {
  return RefreshToken.update(
    { token: newToken },
    { where: { token: oldToken } },
  );
};

const deleteRefreshToken = async (token) => {
  return RefreshToken.destroy({ where: { token } });
};

const deleteAllUserTokens = async (userId) => {
  return RefreshToken.destroy({ where: { userId } });
};

module.exports = {
  COOKIE_OPTIONS,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  rotateRefreshToken,
  deleteRefreshToken,
  deleteAllUserTokens,
};
