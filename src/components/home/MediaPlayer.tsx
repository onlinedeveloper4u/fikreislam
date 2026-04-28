'use client';

import React, { useRef, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
    ExternalLink, X, Music, FileText, Video as VideoIcon,
    Play, Pause, Volume2, VolumeX,
    Download, Repeat, Gauge, RotateCcw, RotateCw, ChevronDown, Minus
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { resolveExternalUrl, resolveItemPageUrl } from '@/lib/storage';

interface MediaPlayerProps {
    isOpen: boolean;
    onMinimize: () => void;
    onDismiss: () => void;
    item: any;
    isPlaying: boolean;
    togglePlay: () => void;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    playbackRate: number;
    onRateChange: (rate: number) => void;
    onSkip: (seconds: number) => void;
    isLooping: boolean;
    toggleLoop: () => void;
    onDownload: (url: string, title: string) => void;
}

export const MediaPlayer = ({
    isOpen,
    onMinimize,
    onDismiss,
    item,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    onSeek,
    playbackRate,
    onRateChange,
    onSkip,
    isLooping,
    toggleLoop,
    onDownload
}: MediaPlayerProps) => {
    if (!item) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const resolvedUrl = item.file_url ? (item.file_url.startsWith('ia://') ? resolveExternalUrl(item.file_url) : item.file_url) : null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onMinimize()}>
            <DialogContent hideClose className="max-w-4xl h-[85vh] p-0 overflow-hidden bg-zinc-950 border-white/10 rounded-[3rem] shadow-2xl">
                <DialogTitle className="sr-only">{item.title}</DialogTitle>
                <DialogDescription className="sr-only">Media Player for {item.title}</DialogDescription>
                
                <div className="flex flex-col h-full bg-zinc-950 text-white relative">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onDismiss}
                                className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
                                title="Dismiss Player"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onMinimize}
                                className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
                                title="Minimize to Bar"
                            >
                                <Minus className="h-6 w-6" />
                            </Button>
                        </div>
                        <h2 className="text-lg font-bold text-white truncate flex-1 text-center pr-10 leading-tight font-urdu">
                            {item.title}
                        </h2>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                        {item.type === 'video' && resolvedUrl ? (
                            <video 
                                src={resolvedUrl} 
                                className="w-full h-full object-contain"
                                controls={false}
                                playsInline
                            />
                        ) : (
                            <div className="relative z-20 flex flex-col items-center gap-6">
                                <div className={`
                                    w-44 h-44 md:w-56 md:h-56 rounded-[2.5rem] 
                                    bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                                    border border-white/10 flex items-center justify-center
                                    shadow-2xl shadow-black/50 backdrop-blur-sm
                                    transition-transform duration-700 ease-out
                                    ${isPlaying ? 'scale-100 rotate-0' : 'scale-95 rotate-[-2deg]'}
                                `}>
                                    <div className={`
                                        w-20 h-20 md:w-24 md:h-24 rounded-full 
                                        bg-gradient-to-br from-emerald-500/20 to-teal-500/10
                                        flex items-center justify-center transition-all duration-700
                                        ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}
                                    `}>
                                        <Music className="h-10 w-10 md:h-12 md:w-12 text-emerald-400/60" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Slider */}
                    <div className="px-8 pt-4 pb-2">
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={0.1}
                            onValueChange={(vals) => onSeek(vals[0])}
                            className="w-full cursor-pointer"
                        />
                        <div className="flex items-center justify-between mt-2 text-[11px] text-white/40 font-mono tabular-nums tracking-wider">
                            <span>{formatTime(currentTime)}</span>
                            <span>{duration ? formatTime(duration) : '--:--'}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="px-8 pb-10 pt-4 flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            {/* Speed Selector */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 px-4 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-mono text-xs gap-2"
                                    >
                                        <Gauge className="h-4 w-4" />
                                        {playbackRate}x
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="center" sideOffset={10} className="bg-zinc-900 border-white/10 text-white rounded-xl z-[150]">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                        <DropdownMenuItem 
                                            key={rate} 
                                            onClick={() => onRateChange(rate)}
                                            className={`cursor-pointer focus:bg-white/10 focus:text-white ${playbackRate === rate ? 'text-emerald-400' : ''}`}
                                        >
                                            {rate}x
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Main Transport */}
                            <div className="flex items-center gap-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => onSkip(-10)}
                                    className="h-12 w-12 text-white/70 hover:text-white hover:bg-white/5 rounded-xl p-0 [&_svg]:size-7"
                                >
                                    <div className="relative">
                                        <RotateCcw strokeWidth={2} />
                                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black">10</span>
                                    </div>
                                </Button>

                                <Button
                                    size="icon"
                                    onClick={togglePlay}
                                    className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 border-0"
                                >
                                    {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => onSkip(10)}
                                    className="h-12 w-12 text-white/70 hover:text-white hover:bg-white/5 rounded-xl p-0 [&_svg]:size-7"
                                >
                                    <div className="relative">
                                        <RotateCw strokeWidth={2} />
                                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black">10</span>
                                    </div>
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Loop Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleLoop}
                                    className={`h-10 w-10 rounded-xl transition-colors ${isLooping ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Repeat className="h-5 w-5" />
                                </Button>

                                {/* Download Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDownload(item.file_url, item.title)}
                                    className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl"
                                >
                                    <Download className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
