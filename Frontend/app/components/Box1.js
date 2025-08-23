import Image from "next/image";

export default function Box1({ text, borderColor, icon }) {
  return (
    <div
      className="w-80 h-40 bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center"
      style={{
        border: `4px solid ${borderColor || "#000"}`,
      }}
    >
      {icon && (
        <Image
          src={icon}
          alt={text}
          width={100}
          height={100}
          className="mb-2"
        />
      )}
      <p className="text-gray-800 font-bold text-center text-base">{text}</p>
    </div>
  );
}
