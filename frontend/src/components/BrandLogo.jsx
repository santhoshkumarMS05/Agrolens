import React from "react";

export const BrandLogo = ({ size = 28, style = {}, className = "" }) => {
  return (
    <img
      src="/brand-logo.png"
      alt="AgroLens Logo"
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.max(6, Math.round(size * 0.24))}px`,
        objectFit: "cover",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
        ...style
      }}
    />
  );
};

export default BrandLogo;
