// components/PublicOnlyRoute.jsx
import { Navigate } from "react-router-dom";

const PublicOnlyRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("user") !== "";
  return isLoggedIn ? <Navigate to="/system" replace /> : children;
};

export default PublicOnlyRoute;
