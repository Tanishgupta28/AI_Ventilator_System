import { url } from "@/url";
import axios from "axios";
import Image from "next/image";

export default function Box1({ text, borderColor, icon, alert }) {

  const handleClick = async () => {
    try{
      const res = await axios.post(`${url}/notification/register`, {
        message: text,
        alert,
        patient: localStorage.getItem("id")
      });
      console.log("Response:", res.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div
      onClick={handleClick}
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
