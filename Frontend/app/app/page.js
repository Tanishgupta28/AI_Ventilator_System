"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role) {
      router.replace(`/${role}`);
    } else {
      router.replace("/signin");
    }
  }, [router]);

  return null; 
}
