const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");
const { COOKIE_OPTIONS } = require("../services/token.service");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const role = "user";

    const existing = await authService.findUserByEmail(email);
    if (existing) {
      const err = new Error("Email already registered");
      err.status = 409;
      throw err;
    }

    const user = await authService.createUser(
      name,
      email,
      password,
      role,
      null,
    );
    res.status(201).json({
      success: true,
      message: "Registered Successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const user = await authService.findUserByEmail(email);
    if (!user) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }
    const isMatch = await authService.validatePassword(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.role,
      user.restaurantId,
    );
    const refreshToken = tokenService.generateRefreshToken(
      user.id,
      user.role,
      user.restaurantId,
    );

    await tokenService.saveRefreshToken(user.id, refreshToken, userAgent);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "Login successfull",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      const err = new Error("Refresh token required");
      err.status = 401;
      throw err;
    }
    const tokenInDb = await tokenService.findRefreshToken(refreshToken);
    if (!tokenInDb) {
      const err = new Error("Refresh token not recognised");
      err.status = 401;
      throw err;
    }

    const decoded = tokenService.verifyRefreshToken(refreshToken);

    const user = await authService.findUserById(decoded.userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      throw err;
    }

    const newAccessToken = tokenService.generateAccessToken(
      user.id,
      user.role,
      user.restaurantId,
    );
    const newRefreshToken = tokenService.generateRefreshToken(
      user.id,
      user.role,
      user.restaurantId,
    );

    await tokenService.rotateRefreshToken(refreshToken, newRefreshToken);

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      const err = new Error("Refresh token required");
      err.status = 400;
      throw err;
    }
    await tokenService.deleteRefreshToken(refreshToken);

    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "Logout Successfull",
    });
  } catch (err) {
    next(err);
  }
};

// const logoutAll = async (req, res, next) => {
//   try {
// req.user is set by protect middleware
//     await tokenService.deleteAllUserTokens(req.user.userId)

//     res.clearCookie('refreshToken', COOKIE_OPTIONS)
//     res.status(200).json({ success: true, message: 'Logged out from all devices' })
//   } catch (err) {
//     next(err)
//   }
// }

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      const err = new Error("Email is required");
      err.status = 400;
      throw err;
    }

    await authService.requestPasswordReset(email.trim().toLowerCase());

    res.status(200).json({
      success: true,
      message:
        "If that email is registered, a password reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};
//Optional endpoint. Frontend calls this when the reset-password page loads
//to check if the token is still valid BEFORE showing the form.
const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      const err = new Error("Token is required");
      err.status = 400;
      throw err;
    }
    await authService.validateResetToken(token);
    res.status(200).json({
      success: true,
      message: "Token is valid",
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword) {
      const err = new Error("token and newPassword are required");
      err.status = 400;
      throw err;
    }

    if (newPassword !== confirmPassword) {
      const err = new Error("Passwords do not match");
      err.status = 400;
      throw err;
    }

    await authService.resetPasswordViaToken(token,newPassword)

    res.status(200).json({
        success:true,
        message:"Password reset successfully. You can now log in with your new password."
    })
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, forgotPassword,validateResetToken,resetPassword };
