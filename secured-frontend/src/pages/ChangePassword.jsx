import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import styles from "../styles/AuthForm.module.css";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const username = JSON.parse(localStorage.getItem("user")).username;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/change-password",
        {
          username,
          currentPassword,
          newPassword,
        }
      );

      setMessage(response.data.message);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => navigate("/system"), 1500);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <div className={styles.formContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2>Change Password</h2>
        <FormInput
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <FormInput
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {error && <p className={styles.errorText}>{error}</p>}
        {message && <p className={styles.successText}>{message}</p>}
        <Button type="submit">Change Password</Button>
      </form>
    </div>
  );
};

export default ChangePassword;
