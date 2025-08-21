import { useState } from "react";
import AudioPlayer from "./Audio";

function Voice({ voices = [], onSubmit }) {
  const [items, setItems] = useState(voices);
  const [isAdding, setIsAdding] = useState(false);
  const [newAudio, setNewAudio] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const handleAddClick = () => setIsAdding(true);

  const handleSubmit = () => {
    if (!newAudio && !newMessage) return;

    // If newAudio is a File, convert it to blob URL
    const audioURL = newAudio instanceof File ? URL.createObjectURL(newAudio) : newAudio;

    const newItem = { audio: audioURL, message: newMessage };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onSubmit && onSubmit({ audio: newAudio, message: newMessage }); // send File to backend

    // Reset input
    setNewAudio(null);
    setNewMessage("");
    setIsAdding(false);
  };

  return (
    <div className="w-[350px] bg-gradient-to-b from-purple-50 to-purple-100 shadow-md rounded-xl p-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-3">Add Voice Message</h2>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto w-full pr-2 no-scrollbar">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-300 bg-white"
          >
            <span className="text-sm font-medium flex-1">
              {item.audio ? <AudioPlayer src={item.audio} /> : "No Audio"}
            </span>
            <span className="text-sm font-semibold text-gray-700 border border-purple-300 rounded-md px-2 py-1">
              {item.message || "No Message"}
            </span>
          </div>
        ))}

        {isAdding && (
          <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-blue-300 bg-white">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setNewAudio(e.target.files[0])}
              className="outline-none text-sm flex-1 mr-2"
            />
            <input
              type="text"
              placeholder="Message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="outline-none text-sm border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        )}
      </div>

      {!isAdding ? (
        <button
          onClick={handleAddClick}
          className="mt-4 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-2xl"
        >
          +
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default Voice;
