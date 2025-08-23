"use client";
import { useRef } from "react";
import Image from "next/image";

export default function UserAvatar({ image, width, height, onImageChange,bool=false }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Image
        src={image}
        alt="User Avatar"
        width={width}
        height={height}
        className="rounded-full object-cover"
      />

      {bool && <div><button
        onClick={() => fileInputRef.current.click()}
        className="mb-1 text-sm text-blue-500 underline"
      >
        Change Image
      </button>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      /></div>}
    </div>
  );
}
