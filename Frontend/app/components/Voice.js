import { useState, useEffect } from "react";
import AudioPlayer from "./Audio";
import Text from "./Text";

function Voice({ voices = [], onSubmit }) {
  const [items, setItems] = useState(voices);
  const [isAdding, setIsAdding] = useState(false);
  const [newAudio, setNewAudio] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Update when voices prop changes
  useEffect(() => {
    setItems(voices);
  }, [voices]);

  const handleAddClick = () => setIsAdding(true);

  const handleSubmit = () => {
    if (!newAudio && !newMessage) return;

    const audioURL =
      newAudio instanceof File ? URL.createObjectURL(newAudio) : newAudio;

    const newItem = { audio: audioURL, message: newMessage };
    setItems((prev) => [...prev, newItem]);

    onSubmit && onSubmit({ file: newAudio, text: newMessage });

    setNewAudio(null);
    setNewMessage("");
    setIsAdding(false);
  };

  return (
    <div className="w-[800px] shadow-lg rounded-2xl p-6 flex flex-col items-center bg-gradient-to-b from-purple-50 to-purple-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Voice Messages</h2>

      {/* Scrollable List */}
      <div className="flex flex-col gap-3 max-h-48 overflow-y-auto w-full pr-2 no-scrollbar pb-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="w-70">
              {item.audio ? <AudioPlayer src={item.audio} /> : "No Audio"}
            </div>
            <span className="text-sm font-semibold text-purple-700 border border-purple-300 bg-purple-50 rounded-md px-3 py-1 w-[150px] h-[50px] truncate flex justify-center items-center">
              <Text>{item.message || "No Message"}</Text>
            </span>
          </div>
        ))}

        {isAdding && (
          <div className="flex gap-2 items-center px-4 py-3 rounded-xl border border-purple-300 bg-white shadow-sm">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setNewAudio(e.target.files[0])}
              className="outline-none text-sm flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="text"
              placeholder="Message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="outline-none text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400"
            />
          </div>
        )}
      </div>

      {/* Floating Button */}
      {!isAdding ? (
        <button
          onClick={handleAddClick}
          className="mt-5 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center text-2xl shadow-md transition-all duration-200"
        >
          +
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          className="mt-5 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md transition-all duration-200"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default Voice;
