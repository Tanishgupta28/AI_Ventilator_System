"use client";

import { useEffect, useState } from "react";
import Box from "./Box";
import Text from "./Text";
import axios from "axios";
import Link from "next/link";
import { url } from "@/url";

export default function Dashboard1({ role, doctorId }) {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${url}/notification/${role}/${doctorId}`);
        console.log(res.data);
        setPatients(res.data);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    }

    fetchData();
  }, [doctorId, role]);

  return (
    <div className="ml-48 p-6 flex-1 flex flex-col items-center">
      <Text size="text-3xl" bold color="text-gray-800">
        DELTA
      </Text>
      <Text size="text-3xl" bold color="text-gray-800" className="mb-6">
        HELP
      </Text>

      <div className="grid grid-cols-3 gap-6">
        {patients.map((p) => (
          <Link key={p._id} href={`/patient/${p._id}`}>
            <Box
              name={p.name || "Unknown"}
              age={p.age || "Unknown"}
              bed={p.bed || "Unknown"}
              image={p.image || "/hospitalIcon.png"}
              alert={p.alert || "/questionMark.png"}
              bgColor={p.bgColor || "bg-red-500"}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
