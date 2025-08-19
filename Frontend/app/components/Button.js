export default function Button({
  children,
  onClick,
  height = "h-10",
  width = "w-32",
  bgColor = "bg-blue-500",
  bold = true,
  rounded = "rounded",
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
    ${bgColor} 
    text-white 
    ${rounded} 
    ${height} 
    ${width} 
    py-2 px-4 
    ${bold ? "font-bold" : "font-normal"}
    ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:opacity-90 cursor-pointer"
    }
  `}
    >
      {children}
    </button>
  );
}
