'use client';

import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { MediaPlayer } from './MediaPlayer';
import { FloatingPlayer } from './FloatingPlayer';
import { resolveExternalUrl } from '@/lib/storage';

export const GlobalPlayer = () => {
    const { 
        activeItem, 
        isPlaying, 
        playbackRate, 
        currentTime, 
        duration, 
        isMinimized,
        isLooping,
        togglePlay,
        toggleLoop,
        skip,
        seek,
        setRate,
        setMinimized,
        close
    } = usePlayer();

    const handleDownload = async (url: string | undefined, title: string) => {
        if (!url) return;
        
        const resolvedUrl = url.startsWith('ia://') ? resolveExternalUrl(url) : url;
        const ext = resolvedUrl.split('.').pop()?.split('?')[0] || 'mp3';
        const filename = `${title}.${ext}`;
        
        const proxyUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(filename)}`;
        window.location.href = proxyUrl;
    };

    if (!activeItem) return null;

    return (
        <>
            <MediaPlayer 
                isOpen={!isMinimized}
                onMinimize={() => setMinimized(true)}
                onDismiss={close}
                item={activeItem}
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                currentTime={currentTime}
                duration={duration}
                onSeek={seek}
                playbackRate={playbackRate}
                onRateChange={setRate}
                onSkip={skip}
                isLooping={isLooping}
                toggleLoop={toggleLoop}
                onDownload={handleDownload}
            />

            <FloatingPlayer 
                isOpen={isMinimized}
                onClose={close}
                onExpand={() => setMinimized(false)}
                title={activeItem.title}
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                type={activeItem.type}
                playbackRate={playbackRate}
                onRateChange={setRate}
            />
        </>
    );
};
