import { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:3000/api/users/forgot-password",
        { email }
      );
      setMessage(res.data.message);
      setShowReset(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}

      {showReset && (
        <div>
          <h4>Paste the token from console:</h4>
          <input
            type="text"
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <a href={`/reset-password?token=${token}`}>
            <button>Continue to Reset</button>
          </a>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
