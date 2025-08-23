import AudioPlayer from "./Audio";

const VoiceNote = ({ url, text }) => {
  // Normalize URL
  const audioUrl = url?.startsWith("http") ? url : `https://${url}`;

  return (
    <div className="bg-gray-900 p-5 rounded-2xl shadow-lg w-full max-w-2xl flex flex-col gap-4">
      {/* Audio player */}
      <AudioPlayer
        src={audioUrl}
        length={0}
      />

      {/* Text/description */}
      {text && (
        <p className="text-gray-200 text-sm font-medium tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
};

export default VoiceNote;
