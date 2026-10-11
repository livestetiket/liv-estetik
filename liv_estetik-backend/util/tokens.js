const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAuthToken, verifyAuthToken };