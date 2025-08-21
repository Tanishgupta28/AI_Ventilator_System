"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export default function AudioPlayer({ src, width = 360, length = 10 }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio.duration) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", updateProgress);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div
      className={`flex items-center gap-3 bg-gradient-to-r from-green-200 to-yellow-200 p-2 rounded-full shadow-md w-[${width}px]`}
    >
      <button
        onClick={togglePlay}
        className="bg-white w-8 h-8 flex items-center justify-center rounded-full shadow"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="flex-1 flex space-x-1 h-8 items-end">
        {Array.from({ length: length }).map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-green-600 rounded-full ${
              isPlaying ? "animate-wave" : ""
            }`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-700 w-16 text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <Volume2 size={18} className="text-gray-700" />
      <audio ref={audioRef} src={src} preload="metadata" />
      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            height: 20%;
          }
          50% {
            height: 100%;
          }
        }
        .animate-wave {
          animation: wave 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
