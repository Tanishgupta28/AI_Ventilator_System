"use client";

import { useRef, useState, useEffect } from "react";
import { Volume2 } from "lucide-react";

export default function AudioPlayer2({
  src,
  width = 360,
  length = 10,
  autoPlayOnNewUrl = false,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ✅ Setup metadata + progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!audio.duration) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const setAudioData = () => setDuration(audio.duration);

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // ✅ Auto play on NEW url (force reload, prevent replay until next src)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Force reload to handle even same src
    const newSrc = `${src}?t=${Date.now()}`;
    audio.src = newSrc;
    audio.load();

    if (autoPlayOnNewUrl) {
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.muted = false;
          setIsPlaying(true);
        })
        .catch((err) => console.warn("Autoplay blocked:", err));
    } else {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [src, autoPlayOnNewUrl]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div
      className={`flex items-center gap-3 bg-gradient-to-r from-green-200 to-yellow-200 p-2 rounded-full shadow-md w-[${width}px]`}
    >
      {/* 🔒 Removed Play/Pause button so user cannot restart manually */}
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

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

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
