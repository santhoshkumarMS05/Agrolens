import React from "react";

export const BrandLogo = ({ size = 38, style = {}, className = "" }) => {
  return (
    <img
      src="/brand-logo.png"
      alt="AgroLens Logo"
      width={size}
      height={size}
      className={`brand-logo-img ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.max(6, Math.round(size * 0.22))}px`,
        objectFit: "cover",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.12)",
        ...style
      }}
    />
  );
};

export default BrandLogo;
