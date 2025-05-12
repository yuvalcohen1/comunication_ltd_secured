import React from "react";
import styles from "../styles/FormInput.module.css";

const FormInput = ({ name, label, type, value, onChange }) => {
  return (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
};

export default FormInput;
