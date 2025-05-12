import React, { useEffect, useState } from "react";
import axios from "axios";
import FormInput from "../components/FormInput";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/CustomerManagement.module.css";

const CustomerManagement = () => {
  const [form, setForm] = useState({ full_name: "", sector: "", package: "" });
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const packageOptions = ["Basic", "Standard", "Premium"];
  const sectorOptions = ["Private", "Business", "Government"];

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/customers");
      setCustomers(response.data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(
        "http://localhost:3000/api/customers/add-customer",
        form
      );
      setMessage(`לקוח \"${response.data.full_name}\" נוסף בהצלחה!`);
      setForm({ full_name: "", sector: "", package: "" });
      fetchCustomers();
    } catch (err) {
      setMessage("שגיאה בהוספת לקוח");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.setItem("user", "");
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "3rem auto" }}>
      <div className={styles.topBar}>
        <h2>Customer Management</h2>
        <Link className={styles.changePasswordBtn} to="/change-password">
          Change Password
        </Link>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
      <h2 style={{ textAlign: "center" }}>Add New Client</h2>
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Full Name"
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          required
        />

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginBottom: "0.3rem" }} htmlFor="sector">
            Sector
          </label>
          <select
            id="sector"
            name="sector"
            value={form.sector}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Choose Sector</option>
            {sectorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="package">Package</label>
          <select
            id="package"
            name="package"
            value={form.package}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Choose Package</option>
            {packageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            fontSize: "1rem",
          }}
        >
          Add Client
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "1rem", color: "green", textAlign: "center" }}>
          {message}
        </p>
      )}

      <h3 style={{ marginTop: "2rem" }}>Existing Clients:</h3>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.full_name} - {c.sector || "לא צויין"} - {c.package}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomerManagement;
