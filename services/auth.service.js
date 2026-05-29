const bcrypt = require("bcryptjs");
const { User, PasswordResetToken, sequelize } = require("../models");
const crypto = require("crypto");
const emailService = require("./email.service");
const Op = require("sequelize");

const findUserByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

const findUserById = async (id) => {
  return User.findByPk(id);
};

const createUser = async (name, email, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  // Never return password outside the service
  const { password: _p, ...safeUser } = user.toJSON();
  return safeUser;
};

//requestPasswordReset
//Called when user submits the "Forgot Password" form.

const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log(`[PasswordReset] Reset requested for unknown email: ${email}`);
    return { sent: false };
  }
  // Invalidate all existing unused tokens for this user.
  await PasswordResetToken.update(
    { expiresAt: new Date() },
    {
      where: {
        userId: user.id,
        usedAt: null,
      },
    },
  );
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await PasswordResetToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const emailSent = await emailService.sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetToken: rawToken,
  });
  return { sent: emailSent, userId: user.id };
};

//validateResetToken

const validateResetToken = async (rawToken) => {
  const tokenHash = hashToken(rawToken);

  const record = await PasswordResetToken.findOne({ where: { tokenHash } });

  if (!record) {
    const err = new Error(
      "This reset link is invalid. Please request a new one",
    );
    err.status = 400;
    throw err;
  }

  if (record.usedAt !== null) {
    const err = new Error(
      "This reset link has already been used. please request a new one",
    );
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(record.expiresAt)) {
    const err = new Error(
      "This reset link has expired. Please request a new one",
    );
    err.status = 400;
    throw err;
  }

  return record;
};

//resetPasswordViaToken
// The actual password reset. Called when user submits the new password
// on the reset-password page.

const resetPasswordViaToken = async (rawToken, newPassword) => {
  const tokenRecord = await validateResetToken(rawToken);

  if (newPassword.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.status = 400;
    throw err;
  }
  if (newPassword.length > 100) {
    const err = new Error("Password is too long");
    err.status = 400;
    throw err;
  }
  const user = User.findByPk(tokenRecord.userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const t = await sequelize.transaction();
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword }, { transaction: t });
    await tokenRecord.update({ usedAt: new Date() }, { transaction: t });
    await PasswordResetToken.update(
      { expiresAt: new Date() },
      {
        where: {
          userId: user.id,
          usedAt: null,
          id: { [Op.ne]: tokenRecord.id },
        },
        transaction: t,
      },
    );
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
  try {
    await emailService.sendPasswordChangedEmail({
      email: user.email,
      name: user.name,
    });
  } catch (emailErr) {
    console.error(
      "[Email] Failed to send password changed notification:",
      emailErr.message,
    );
  }

  return { success: true };
};

//changePasswordInProfile

const changePasswordInProfile = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    const err = new Error(
      "New password must be different from your current password",
    );
    err.status = 400;
    throw err;
  }
  if (newPassword.length < 6) {
    const err = new Error("New password must be at least 6 characters");
    err.status = 400;
    throw err;
  }
  if (newPassword.length > 100) {
    const err = new Error("Password is too long");
    err.status = 400;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword });

  // Security notification
  try {
    await emailService.sendPasswordChangedEmail({
      email: user.email,
      name: user.name,
    });
  } catch (emailErr) {
    console.error(
      "[Email] Failed to send password changed notification:",
      emailErr.message,
    );
  }

  return { success: true };
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  validatePassword,
  requestPasswordReset,
  validateResetToken,
  resetPasswordViaToken,
  changePasswordInProfile
};
