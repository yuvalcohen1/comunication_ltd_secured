import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import styles from "../styles/Register.module.css";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState([]);
  const [serverMessage, setServerMessage] = useState("");

  const config = {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    disallowFromDictionary: ["password", "123456", "qwerty"],
  };

  const validatePassword = (pwd) => {
    const errs = [];
    if (pwd.length < config.minLength)
      errs.push(`סיסמה חייבת להכיל לפחות ${config.minLength} תווים`);
    if (config.requireUppercase && !/[A-Z]/.test(pwd))
      errs.push("סיסמה חייבת להכיל לפחות אות גדולה אחת");
    if (config.requireLowercase && !/[a-z]/.test(pwd))
      errs.push("סיסמה חייבת להכיל לפחות אות קטנה אחת");
    if (config.requireNumbers && !/[0-9]/.test(pwd))
      errs.push("סיסמה חייבת להכיל לפחות ספרה אחת");
    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      errs.push("סיסמה חייבת להכיל לפחות תו מיוחד אחד");
    if (
      config.disallowFromDictionary.some((word) =>
        pwd.toLowerCase().includes(word)
      )
    )
      errs.push("הסיסמה מכילה מילה אסורה (לדוגמה: password, 123456)");

    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwdErrors = validatePassword(form.password);
    if (pwdErrors.length > 0) {
      setErrors(pwdErrors);
      setServerMessage("");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerMessage(data.error || "אירעה שגיאה");
        setErrors(data.details || []);
      } else {
        setServerMessage("נרשמת בהצלחה!");
        setErrors([]);
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setServerMessage("שגיאת רשת");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Register</h2>
        <FormInput
          label="Username"
          name="username"
          type="text"
          value={form.username}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button type="submit">Sign Up</Button>
        {errors.length > 0 && (
          <div className={styles.errorBox}>
            {errors.map((err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        )}
        {serverMessage && <p className={styles.message}>{serverMessage}</p>}
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
