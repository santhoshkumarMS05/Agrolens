import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const SSOCallbackPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
};

export default SSOCallbackPage;
