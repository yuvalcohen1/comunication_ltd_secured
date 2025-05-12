const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const config = require(path.join(__dirname, "../config/passwordConfig.json"));

function validatePassword(password) {
  const errors = [];
  if (password.length < config.minLength) errors.push("Too short");
  if (config.requireUppercase && !/[A-Z]/.test(password))
    errors.push("Missing uppercase");
  if (config.requireLowercase && !/[a-z]/.test(password))
    errors.push("Missing lowercase");
  if (config.requireNumbers && !/\d/.test(password))
    errors.push("Missing digit");
  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push("Missing special char");
  return errors;
}

function hashPassword(password, salt) {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = { validatePassword, hashPassword, generateSalt };
