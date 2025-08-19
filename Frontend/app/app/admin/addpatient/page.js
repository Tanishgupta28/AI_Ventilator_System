'use client';

import PatientForm from "@/components/Patient";
import UserAvatar from "@/components/UserAvatar";
import Image from "next/image";

export default function AddPatientPage() {
  return (
    <div className="p-6 flex-1 flex flex-col items-center gap-6 h-screen overflow-y-auto">
      <Image src="/lovelogo.png" alt="Add Patient" width={150} height={100} />
      <UserAvatar image="/kissan.png" width={100} height={100} />
      <PatientForm />
    </div>
  );
}
