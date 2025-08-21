import { useEffect, useState } from "react";
import Directive from "./Directive";
import axios from "axios";
import { url } from "@/url";

export default function Notify({ notifications }) {


  return (
    <nav
      className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4 
                 fixed right-0 top-16 shadow-xl rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
    >
      <h2 className="text-lg font-semibold mb-4 text-center">
        Notify Directive
      </h2>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((note, index) => (
            <Directive
              key={index}
              color={note.color}
              message={note.message}
              patientId={note.patientId}
              patientName={note.patientName}
              bed={note.bed}
              time={note.time}
            />
          ))
        ) : (
          <p className="text-gray-400 text-sm text-center">No notifications</p>
        )}
      </div>
    </nav>
  );
}
