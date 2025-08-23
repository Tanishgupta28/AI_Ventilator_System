import Image from "next/image";

export default function Box2({ text, bgColor, icon }) {
  return (
    <div
      className="flex flex-row items-center justify-center rounded-2xl shadow-md p-6 w-36 h-36"
      style={{ backgroundColor: bgColor || "#ddd" }}
    >
      {icon && (
        <Image
          src={icon}
          alt={text}
          width={40}
          height={40}
          className="mr-2"
        />
      )}
      <p className="text-white font-bold text-lg">{text}</p>
    </div>
  );
}
