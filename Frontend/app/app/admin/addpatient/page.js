"use client";

import PatientForm from "@/components/Patient";
import UserAvatar from "@/components/UserAvatar";
import Image from "next/image";
import { useState } from "react";

export default function AddPatientPage() {
  const [avatar, setAvatar] = useState("/kissan.png");
  const [avatarFile, setAvatarFile] = useState(null);

  return (
    <div className="p-6 flex-1 flex flex-col items-center h-screen overflow-y-auto">
      <Image src="/lovelogo.png" alt="Add Patient" width={150} height={100} />

      <UserAvatar
        image={avatar}
        width={100}
        height={100}
        onImageChange={(file) => {
          setAvatar(URL.createObjectURL(file));
          setAvatarFile(file);
        }}
        bool={true}
      />
      <PatientForm avatarFile={avatarFile} />
    </div>
  );
}
