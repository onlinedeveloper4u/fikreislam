'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronUp, Play, Pause, Music, Video as VideoIcon, 
    BookOpen, Gauge 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface FloatingPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    onExpand: () => void;
    title: string;
    isPlaying: boolean;
    togglePlay: () => void;
    type: 'audio' | 'video' | 'book';
    playbackRate: number;
    onRateChange: (rate: number) => void;
}

export const FloatingPlayer = ({
    isOpen,
    onClose,
    onExpand,
    title,
    isPlaying,
    togglePlay,
    type,
    playbackRate,
    onRateChange
}: FloatingPlayerProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 inset-x-0 mx-auto z-[100] w-[95%] max-w-4xl"
                >
                    <div className="bg-zinc-900/90 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2rem] h-20 flex flex-row items-center justify-between px-6 overflow-hidden">
                        {/* LTR container for controls to keep standard player feel */}
                        <div className="flex flex-row items-center justify-between w-full gap-4 dir-ltr">
                            {/* Controls (Standard Left side) */}
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={onClose}
                                    className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={onExpand}
                                    className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
                                >
                                    <ChevronUp className="h-5 w-5" />
                                </Button>
                                
                                <div className="h-8 w-[1px] bg-white/10 mx-2" />
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            className="h-10 px-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-bold text-sm gap-2"
                                        >
                                            <Gauge className="h-4 w-4" />
                                            {playbackRate}x
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="center" sideOffset={10} className="bg-zinc-900 border-white/10 text-white rounded-xl shadow-2xl z-[150]">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                            <DropdownMenuItem 
                                                key={rate} 
                                                onClick={() => onRateChange(rate)}
                                                className={`cursor-pointer focus:bg-white/10 focus:text-white ${playbackRate === rate ? 'text-emerald-400 font-bold' : 'text-white/60'}`}
                                            >
                                                {rate}x
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Center/Play Area */}
                            <div className="flex-1 flex flex-row items-center gap-6 px-6 overflow-hidden">
                                <Button
                                    onClick={togglePlay}
                                    className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex-shrink-0"
                                >
                                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                                </Button>

                                <div className="flex-1 min-w-0 flex flex-col items-end">
                                    <h3 className="font-urdu text-xl font-bold text-white truncate w-full text-right leading-tight" dir="rtl">
                                        {title}
                                    </h3>
                                </div>
                            </div>

                            {/* Right side Icon */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-emerald-400 shadow-inner">
                                    {type === 'audio' ? <Music className="h-6 w-6" /> : 
                                     type === 'video' ? <VideoIcon className="h-6 w-6" /> : 
                                     <BookOpen className="h-6 w-6" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
