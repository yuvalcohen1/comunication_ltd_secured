import React, { useState } from "react";
import axios from "axios";
import styles from "../styles/Login.module.css";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username || !password) {
      setMessage("אנא מלא שם משתמש וסיסמה");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/users/login", {
        username,
        password,
      });

      setMessage(res.data.message);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      console.log(JSON.parse(localStorage.getItem("user")));
      console.log(JSON.parse(localStorage.getItem("user")).username);

      navigate("/system");
    } catch (err) {
      if (err.response) {
        setMessage(err.response.data.error);
        if (err.response.data.remainingAttempts >= 0) {
          setMessage(
            `${err.response.data.error} (${err.response.data.remainingAttempts} ניסיונות נותרו)`
          );
        }
      } else {
        setMessage("שגיאת רשת או שרת");
      }
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>LOGIN</h2>
        <FormInput
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {message && <p className={styles.message}>{message}</p>}
        <Button type="submit">Login</Button>
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            Sign Up
          </Link>
        </p>
        <p>
          Forgot your password? <Link to="/forgot-password">Click here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
