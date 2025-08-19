"use client";

import { useState } from "react";
import { alertConfig } from "@/lib/alert";
import { format } from "date-fns";
import Text from "./Text";
import Button from "./Button";
import { url } from "@/url";

export default function NotifyBox({ day, notifications = [] }) {
  console.log("NotifyBox Props:", { day, notifications });
  const [items, setItems] = useState(notifications);
  const handleAccept = async (id) => {
    try {
      console.log("Processing notification:", id);
      const response=await axios.post(`${url}/api/notifications/${id}/accept`);
      const data = response.data;
      if (response.status === 200 && data.success) {
        setItems((prev) =>
          prev.map((n) =>
            n._id === id ? { ...n, success: true } : n
          )
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
            <div
              className={`absolute left-0 top-0 h-full w-2 ${
                alertConfig[n.alert]?.bgColor
              } rounded-l-sm`}
            ></div>
            <div className="flex justify-between items-center w-full pl-4">
              <div className="flex gap-30">
                <Text size="text-2xl" bold>
                  {date}
                </Text>
                <Text size="text-2xl" bold>
                  {n.message}
                </Text>
              </div>
              <div className="flex items-center space-x-3">
                <Text size="text-2xl" bold>
                  {time}
                </Text>
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
