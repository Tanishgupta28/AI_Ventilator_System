import jwt from "jsonwebtoken";
import ApiError from "./errorClass.js";

export function generateToken(payload) {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });
  } catch (error) {
    console.log("Token signing failed: ", error);
    throw new ApiError(
      500,
      "Try logging in after some time",
      "INTERNAL_SERVER_ERROR"
    );
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log("Token verification failed", err);
    throw new ApiError(401, "Invalid token", "INVALID_TOKEN");
  }
}
