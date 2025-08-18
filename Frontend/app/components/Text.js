"use client";

export default function Text({
  children,
  size = "text-base",
  bold = false,
  color = "text-black",
  font = "font-sans",
  className = "",
}) {
  return (
    <p className={`${size} ${bold ? "font-bold" : ""} ${font} ${color} ${className}`}>
      {children}
    </p>
  );
}
