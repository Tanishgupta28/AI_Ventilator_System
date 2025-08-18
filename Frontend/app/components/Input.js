"use client";

export default function InputField({
  label = "Label",
  value = "",
  placeholder = "",
  type = "text",
  onChange = () => {},
  className = "",
  width = "w-full",
  height = "h-10",
}) {
  const widthClass =
    typeof width === "string" ? width : "";
  const heightClass =
    typeof height === "string" ? height : "";

  const inlineStyle =
    typeof width === "number" || typeof height === "number"
      ? {
          width: typeof width === "number" ? `${width}px` : undefined,
          height: typeof height === "number" ? `${height}px` : undefined,
        }
      : {};

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label className="text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={inlineStyle}
        className={`${widthClass} ${heightClass} px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50`}
      />
    </div>
  );
}
