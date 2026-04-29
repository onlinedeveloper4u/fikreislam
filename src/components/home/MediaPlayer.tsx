'use client';

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
    volume: number;
    onVolumeChange: (volume: number) => void;
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
    volume,
    onVolumeChange,
    onDownload
}: MediaPlayerProps) => {
    if (!item) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const resolvedUrl = item.file_url ? (item.file_url.startsWith('ia://') ? resolveExternalUrl(item.file_url) : item.file_url) : null;

    const [isVolumeExpanded, setIsVolumeExpanded] = useState(false);

    // Auto-collapse volume after 5 seconds of inactivity
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isVolumeExpanded) {
            timeout = setTimeout(() => {
                setIsVolumeExpanded(false);
            }, 5000);
        }
        return () => clearTimeout(timeout);
    }, [isVolumeExpanded, volume]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onMinimize()}>
            <DialogContent 
                hideClose 
                className="w-[95%] max-w-4xl h-auto md:h-[85vh] max-h-[95vh] p-0 overflow-hidden bg-zinc-950 border-white/10 rounded-[2rem] md:rounded-[3rem] shadow-2xl top-auto bottom-6 translate-y-0 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full"
            >
                <DialogTitle className="sr-only">{item.title}</DialogTitle>
                <DialogDescription className="sr-only">Media Player for {item.title}</DialogDescription>
                
                <div className="flex flex-col h-full bg-zinc-950 text-white relative">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/5">
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
                        <h2 className="text-base md:text-lg font-bold text-white truncate flex-1 text-center pr-4 md:pr-10 leading-tight font-urdu">
                            {item.title}
                        </h2>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden py-8 md:py-12">
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
                                    w-32 h-32 md:w-56 md:h-56 rounded-[2rem] md:rounded-[2.5rem] 
                                    bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                                    border border-white/10 flex items-center justify-center
                                    shadow-2xl shadow-black/50 backdrop-blur-sm
                                    transition-transform duration-700 ease-out
                                    ${isPlaying ? 'scale-100 rotate-0' : 'scale-95 rotate-[-2deg]'}
                                `}>
                                    <div className={`
                                        w-14 h-14 md:w-24 md:h-24 rounded-full 
                                        bg-gradient-to-br from-emerald-500/20 to-teal-500/10
                                        flex items-center justify-center transition-all duration-700
                                        ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}
                                    `}>
                                        <Music className="h-7 w-7 md:h-12 md:w-12 text-emerald-400/60" />
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
                            dir="rtl"
                        />
                        <div className="flex items-center justify-between mt-2 text-[11px] text-white/40 font-mono tabular-nums tracking-wider" dir="rtl">
                            <span>{formatTime(currentTime)}</span>
                            <span>{duration ? formatTime(duration) : '--:--'}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="px-3 md:px-8 pb-6 md:pb-10 pt-4">
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                            {/* Left Section: Speed & Volume */}
                            <div className="flex items-center gap-1 md:gap-6 flex-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 md:h-10 px-2 md:px-4 rounded-xl text-white/40 hover:text-white hover:bg-white/10 font-mono text-[10px] md:text-xs gap-1 md:gap-2"
                                        >
                                            <Gauge className="h-3 w-3 md:h-4 md:w-4" />
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

                                {/* Volume Control */}
                                <div className="flex items-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 md:h-10 md:w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl shrink-0"
                                            >
                                                {volume === 0 ? <VolumeX className="h-4 w-4 md:h-5 md:w-5" /> : <Volume2 className="h-4 w-4 md:h-5 md:w-5" />}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent side="top" align="center" sideOffset={12} className="w-10 p-2 bg-zinc-950/90 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl z-[150]">
                                            <div className="h-32 flex flex-col items-center py-2">
                                                <Slider
                                                    value={[volume * 100]}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={(vals) => onVolumeChange(vals[0] / 100)}
                                                    className="h-full cursor-pointer"
                                                    orientation="vertical"
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Center Section: Transport */}
                            <div className="flex items-center gap-2 md:gap-6 flex-1 justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => onSkip(10)}
                                    className="h-9 w-9 md:h-12 md:w-12 text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-0 [&_svg]:size-5 md:[&_svg]:size-7"
                                >
                                    <div className="relative">
                                        <RotateCcw strokeWidth={2} />
                                        <span className="absolute inset-0 flex items-center justify-center text-[6px] md:text-[7px] font-black">10</span>
                                    </div>
                                </Button>

                                <Button
                                    size="icon"
                                    onClick={togglePlay}
                                    className="h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 border-0"
                                >
                                    {isPlaying ? <Pause className="h-6 w-6 md:h-10 md:w-10" /> : <Play className="h-6 w-6 md:h-10 md:w-10 ml-1" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => onSkip(-10)}
                                    className="h-9 w-9 md:h-12 md:w-12 text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-0 [&_svg]:size-5 md:[&_svg]:size-7"
                                >
                                    <div className="relative">
                                        <RotateCw strokeWidth={2} />
                                        <span className="absolute inset-0 flex items-center justify-center text-[6px] md:text-[7px] font-black">10</span>
                                    </div>
                                </Button>
                            </div>

                            {/* Right Section: Actions */}
                            <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleLoop}
                                    className={`h-9 w-9 md:h-10 md:w-10 rounded-xl transition-all duration-300 ${isLooping ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                                >
                                    <Repeat className={`h-4 w-4 md:h-5 md:w-5 ${isLooping ? 'animate-pulse' : ''}`} />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDownload(item.file_url, item.title)}
                                    className="h-9 w-9 md:h-10 md:w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
                                >
                                    <Download className="h-4 w-4 md:h-5 md:w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
