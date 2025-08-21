import { useState } from "react";

function Member({ members = [], onSubmit }) {
  const [items, setItems] = useState(members);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleSubmit = () => {
    if (!newName || !newRole) return;
    const newItem = { name: newName, role: newRole };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onSubmit && onSubmit(newItem);
    setNewName("");
    setNewRole("");
    setIsAdding(false);
  };

  return (
    <div className="w-[350px] bg-gradient-to-b from-blue-50 to-blue-100 shadow-md rounded-xl p-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-3">Add Member</h2>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto w-full pr-2 no-scrollbar">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-300 bg-white"
          >
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-sm font-semibold text-gray-700 border border-blue-300 rounded-md px-2 py-1">
              {item.role}
            </span>
          </div>
        ))}
        {isAdding && (
          <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-blue-300 bg-white">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="outline-none text-sm flex-1 mr-2"
            />
            <input
              type="text"
              placeholder="Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
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
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default Member;
