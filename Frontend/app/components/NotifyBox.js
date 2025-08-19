"use client";

import { useEffect, useState } from "react";
import { alertConfig } from "@/lib/alert";
import { format } from "date-fns";
import Text from "./Text";
import Button from "./Button";
import { url } from "@/url";
import axios from "axios";

export default function NotifyBox({ notifications = [] }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (notifications?.length > 0) {
      setItems(notifications);
    }
  }, [notifications]);

  const handleAccept = async (id) => {
    try {
      console.log("Processing notification:", id);
      const response = await axios.post(`${url}/notification/${id}`);
      const data = response.data;
      if (response.status === 200) {
        setItems((prev) =>
          prev.map((n) => (n._id === id ? { ...n, success: true } : n))
        );
      } else {
        console.error("Failed:", data);
      }
    } catch (error) {
      console.error("Error in handleAccept:", error);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {items.map((n) => {
        const date = format(new Date(n.uploadedAt), "dd MMM");
        const time = format(new Date(n.uploadedAt), "HH:mm");

        return (
          <div
            key={n._id}
            className="relative flex items-center justify-between p-3 bg-white rounded-sm shadow-sm w-full"
          >
            {/* Left alert color strip */}
            <div
              className={`absolute left-0 top-0 h-full w-2 ${
                alertConfig[n.alert]?.bgColor || "bg-gray-400"
              } rounded-l-sm`}
            ></div>

            {/* Content */}
            <div className="flex justify-between items-center w-full pl-4">
              {/* Left side */}
              <div className="flex gap-6">
                <Text size="text-sm" bold>
                  {date}
                </Text>
                <Text size="text-sm">{n.message}</Text>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-3">
                <Text size="text-sm">{time}</Text>
                <Button
                  width="w-22"
                  bgColor={n.success ? "bg-gray-500" : "bg-blue-500"}
                  rounded="rounded-md"
                  disabled={n.success}
                  onClick={() => handleAccept(n._id)}
                >
                  {n.success ? "Done" : "Accept"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
