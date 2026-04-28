'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { resolveExternalUrl } from '@/lib/storage';

export type ContentType = 'audio' | 'video' | 'book';

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  author?: string;
  description?: string;
  cover_image_url?: string;
  file_url?: string;
  file_size?: number;
  duration?: string;
  date?: string;
  language?: string;
}

interface PlayerContextType {
  activeItem: ContentItem | null;
  isPlaying: boolean;
  playbackRate: number;
  currentTime: number;
  duration: number;
  isMinimized: boolean;
  isLooping: boolean;
  play: (item: ContentItem) => void;
  pause: () => void;
  togglePlay: () => void;
  toggleLoop: () => void;
  skip: (seconds: number) => void;
  seek: (time: number) => void;
  setRate: (rate: number) => void;
  setMinimized: (minimized: boolean) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        
        const audio = audioRef.current;
        
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && activeItem?.file_url) {
        const url = activeItem.file_url.startsWith('ia://') 
            ? resolveExternalUrl(activeItem.file_url) 
            : activeItem.file_url;
        
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        if (isPlaying) {
            audioRef.current.play().catch(console.error);
        }
    }
  }, [activeItem]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const play = useCallback((item: ContentItem) => {
    setActiveItem(item);
    setIsPlaying(true);
    setIsMinimized(false);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
        audioRef.current?.pause();
    } else {
        audioRef.current?.play().catch(console.error);
    }
  }, [isPlaying]);

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => {
        if (audioRef.current) {
            audioRef.current.loop = !prev;
        }
        return !prev;
    });
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime += seconds;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
    }
  }, []);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
  }, []);

  const setMinimized = useCallback((minimized: boolean) => {
    setIsMinimized(minimized);
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = '';
    setActiveItem(null);
    setIsPlaying(false);
    setIsMinimized(true);
  }, []);

  return (
    <PlayerContext.Provider value={{
      activeItem,
      isPlaying,
      playbackRate,
      currentTime,
      duration,
      isMinimized,
      isLooping,
      play,
      pause,
      togglePlay,
      toggleLoop,
      skip,
      seek,
      setRate,
      setMinimized,
      close
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
