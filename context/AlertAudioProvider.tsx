"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRealtimeNodes } from "@/hooks/useRealtimeNodes";

type ThreatLevel = 1 | 2 | 3;

interface AlertAudioContextValue {
  toggleMute: (nodeId: string) => void;
  mutedNodes: Record<string, boolean>;
}

const AlertAudioContext = createContext<AlertAudioContextValue | undefined>(undefined);

export const useAlertAudio = () => {
  const ctx = useContext(AlertAudioContext);
  if (!ctx) throw new Error("useAlertAudio must be used within AlertAudioProvider");
  return ctx;
};

interface AlertAudioProviderProps {
  children: ReactNode;
}

export const AlertAudioProvider = ({ children }: AlertAudioProviderProps) => {
  const { nodes } = useRealtimeNodes();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  const lastPlayTimeRef = useRef<Record<string, number>>({});
  const playCountRef = useRef<Record<string, number>>({});
  const prevThreatRef = useRef<Record<string, ThreatLevel | null>>({});

  const [mutedNodes, setMutedNodes] = useState<Record<string, boolean>>({});

  const COOLDOWN_MS = 5000;
  const MAX_PLAY = 3;

  // INIT AUDIO
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.9;
    audioRef.current.preload = "auto";
  }, []);

  // UNLOCK AUDIO DENGAN GESTURE
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current || unlockedRef.current) return;

      audioRef.current.src = "/sounds/Node1Warning.m4a";
      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
          unlockedRef.current = true;
          console.log("🔓 Audio unlocked globally");
        })
        .catch(() => {});
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  // PLAY LOGIC OTOMATIS
  useEffect(() => {
    if (!audioRef.current || !unlockedRef.current) return;

    Object.entries(nodes).forEach(([nodeId, node]) => {
      const threat = Number(node.threat) as ThreatLevel;
      if (mutedNodes[nodeId]) return;

      const prevThreat = prevThreatRef.current[nodeId] ?? null;
      const now = Date.now();

      const isThreat = threat === 2 || threat === 3;
      const threatChanged = prevThreat !== threat;
      const cooldownPassed =
        !lastPlayTimeRef.current[nodeId] || now - lastPlayTimeRef.current[nodeId] >= COOLDOWN_MS;
      const canPlay = !playCountRef.current[nodeId] || playCountRef.current[nodeId] < MAX_PLAY;

      if (isThreat && (threatChanged || (cooldownPassed && canPlay))) {
        // PASTIKAN audioRef.current tidak null
        const audio = audioRef.current;
        if (!audio) return;

        audio.src = threat === 2 ? "/sounds/Node1Warning.m4a" : "/sounds/Node1Danger.m4a";
        audio.currentTime = 0;

        audio
          .play()
          .then(() => {
            lastPlayTimeRef.current[nodeId] = now;
            playCountRef.current[nodeId] = (playCountRef.current[nodeId] ?? 0) + 1;
            console.log(`🔊 ${nodeId} alert played (${playCountRef.current[nodeId]}/${MAX_PLAY})`);
          })
          .catch((err) => console.warn("❌ Audio play failed:", err));
      }

      prevThreatRef.current[nodeId] = threat;
    });
  }, [nodes, mutedNodes]);

  const toggleMute = (nodeId: string) => {
    setMutedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  return (
    <AlertAudioContext.Provider value={{ toggleMute, mutedNodes }}>
      {children}
    </AlertAudioContext.Provider>
  );
};
