const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const db = require("../config/db");
const {
  validatePassword,
  hashPassword,
  generateSalt,
} = require("../utils/passwordUtils");

const {
  maxLoginAttempts,
  passwordHistoryCount,
} = require("../config/passwordConfig.json");

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // 1. Validate input
  if (!username || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  const errors = validatePassword(password);
  if (errors.length)
    return res.status(400).json({ error: "Password invalid", details: errors });

  try {
    // 2. Check if user exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ error: "Username or email already exists" });

    // 3. Generate salt and hash
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // 4. Save user to DB
    await db.query(
      `INSERT INTO users (username, email, password_hash, password_salt, failed_login_attempts, last_passwords)
         VALUES (?, ?, ?, ?, 0, JSON_ARRAY(?))`,
      [username, email, passwordHash, salt, passwordHash]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    // שליפת המשתמש מה-DB
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid username or password" });

    const user = rows[0];

    // בדיקה אם החשבון נעול
    if (user.failed_login_attempts >= maxLoginAttempts)
      return res
        .status(403)
        .json({ error: "Account locked due to too many failed attempts" });

    // יצירת hash חדש מהסיסמה שסופקה
    const hashedInput = hashPassword(password, user.password_salt);

    if (hashedInput === user.password_hash) {
      // הצלחה: אפס את הניסיונות הכושלים
      await db.query(
        "UPDATE users SET failed_login_attempts = 0 WHERE id = ?",
        [user.id]
      );
      return res.status(200).json({ message: "Login successful", user });
    } else {
      // כישלון: הגדלת מספר הניסיונות
      const newAttempts = user.failed_login_attempts + 1;
      await db.query(
        "UPDATE users SET failed_login_attempts = ? WHERE id = ?",
        [newAttempts, user.id]
      );

      const remaining = maxLoginAttempts - newAttempts;
      return res.status(401).json({
        error: "Invalid username or password",
        remainingAttempts: remaining > 0 ? remaining : 0,
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    // בדיקה שהסיסמה הנוכחית נכונה
    const currentHash = hashPassword(currentPassword, user.password_salt);
    if (currentHash !== user.password_hash) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // בדיקה שהסיסמה החדשה שונה מהנוכחית
    const newHash = hashPassword(newPassword, user.password_salt);
    if (newHash === user.password_hash) {
      return res
        .status(400)
        .json({ error: "New password must be different from current" });
    }

    // בדיקת תקינות הסיסמה
    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        issues: validationErrors,
      });
    }

    // בדיקה מול היסטוריית סיסמאות
    const history = JSON.parse(user.last_passwords || "[]");
    if (history.includes(newHash)) {
      return res
        .status(400)
        .json({ error: "Password was recently used. Choose a different one." });
    }

    // יצירת salt חדש, שמירת הסיסמה החדשה, עדכון היסטוריה
    const newSalt = generateSalt();
    const finalHash = hashPassword(newPassword, newSalt);

    const newHistory = [user.password_hash, ...history].slice(
      0,
      passwordHistoryCount
    );

    await db.query(
      "UPDATE users SET password_hash = ?, password_salt = ?, last_passwords = ? WHERE id = ?",
      [finalHash, newSalt, JSON.stringify(newHistory), user.id]
    );

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "If the email exists, a reset link has been sent" }); // לא נותן רמז אם קיים
    }

    const user = rows[0];

    // צור טוקן אקראי באמצעות SHA-1
    const rawToken = crypto.randomBytes(20).toString("hex");
    const resetToken = crypto.createHash("sha1").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // תוקף של 15 דקות

    // עדכן בטבלת users
    await db.query(
      "UPDATE users SET reset_token = ?, token_expiry = ? WHERE id = ?",
      [resetToken, expiry, user.id]
    );

    // שלח את הטוקן (לצורך הדוגמה נדפיס)
    console.log(
      `Password reset link for ${email}: http://localhost:3000/reset-password?token=${resetToken}`
    );

    return res
      .status(200)
      .json({ message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    console.error("Error in forgot-password:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing token or new password" });
  }

  try {
    // חפש את המשתמש לפי טוקן
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND token_expiry > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = rows[0];

    // בדוק אם הסיסמה עומדת בדרישות
    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        issues: validationErrors,
      });
    }

    // ודא שהסיסמה החדשה שונה מהקודמת
    const newHash = hashPassword(newPassword, user.password_salt);
    if (newHash === user.password_hash) {
      return res.status(400).json({ error: "New password must be different" });
    }

    // בדיקה מול היסטוריית סיסמאות
    const history = JSON.parse(user.last_passwords || "[]");
    if (history.includes(newHash)) {
      return res.status(400).json({ error: "Password was recently used" });
    }

    // צור salt חדש
    const newSalt = crypto.randomBytes(16).toString("hex");
    const finalHash = hashPassword(newPassword, newSalt);
    const newHistory = [user.password_hash, ...history].slice(0, 3);

    await db.query(
      "UPDATE users SET password_hash = ?, password_salt = ?, last_passwords = ?, reset_token = NULL, token_expiry = NULL WHERE id = ?",
      [finalHash, newSalt, JSON.stringify(newHistory), user.id]
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
