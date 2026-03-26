import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    ExternalLink, X, Music,
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Download, Repeat
} from "lucide-react";
import { resolveIADownloadUrl, resolveIAItemUrl } from '@/lib/internetArchive';

interface MediaPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url: string | null;
    type: 'book' | 'audio' | 'video';
}

/**
 * Resolves various URL types to direct links for playback/viewing
 */
const resolveMediaUrl = (url: string | null) => {
    if (!url) return '';

    // Handle ia:// scheme — direct download URL for native playback
    if (url.includes('ia://')) {
        return resolveIADownloadUrl(url);
    }


    // Handle standard Google Drive links
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/file\/d\/(.+?)\/|\/file\/d\/(.+?)$/) || url.match(/id=(.+?)(&|$)/);
        const id = idMatch ? (idMatch[1] || idMatch[2]) : null;
        if (id) {
            return `https://drive.google.com/file/d/${id}/preview`;
        }
    }

    return url;
};

const resolveExternalUrl = (url: string | null) => {
    if (!url) return '';
    if (url.includes('ia://')) {
        return resolveIAItemUrl(url);
    }
    return url;
};

const resolveDownloadUrl = (url: string | null) => {
    if (!url) return '';
    if (url.includes('ia://')) {
        return resolveIADownloadUrl(url);
    }
    return url;
};

/** Format seconds => mm:ss or hh:mm:ss */
function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Canvas-based audio visualizer — animated bars
 */
function AudioVisualizer({ analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth * dpr;
            const h = canvas.clientHeight * dpr;
            canvas.width = w;
            canvas.height = h;

            ctx.clearRect(0, 0, w, h);

            const barCount = 64;
            const gap = 3 * dpr;
            const barWidth = (w - gap * (barCount - 1)) / barCount;
            const step = Math.floor(bufferLength / barCount);

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step] / 255;
                const barH = Math.max(3 * dpr, value * h * 0.85);

                // Gradient from primary to accent
                const hue = 152 + (i / barCount) * 30; // green-teal spectrum
                const alpha = 0.4 + value * 0.6;

                ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
                ctx.beginPath();
                const x = i * (barWidth + gap);
                const radius = Math.min(barWidth / 2, 4 * dpr);
                // Rounded top bars
                ctx.roundRect(x, h - barH, barWidth, barH, [radius, radius, 0, 0]);
                ctx.fill();
            }
        };

        if (isPlaying) {
            draw();
        }

        return () => {
            cancelAnimationFrame(animRef.current);
        };
    }, [analyser, isPlaying]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ opacity: isPlaying ? 1 : 0.3, transition: 'opacity 0.5s ease' }}
        />
    );
}

/**
 * Premium Custom Audio Player for direct-streaming URLs (IA, Supabase)
 */
function CustomAudioPlayer({ url, title, externalUrl, downloadUrl }: {
    url: string;
    title: string;
    externalUrl: string;
    downloadUrl: string;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Setup audio context for visualizer
    const initAudioContext = useCallback(() => {
        if (audioCtxRef.current || !audioRef.current) return;
        try {
            const ctx = new AudioContext();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            const source = ctx.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
            sourceRef.current = source;
        } catch (e) {
            console.debug('AudioContext setup failed (non-critical):', e);
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDuration = () => {
            if (isFinite(audio.duration)) {
                setDuration(audio.duration);
                setIsLoaded(true);
            }
        };
        const onEnded = () => setIsPlaying(false);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onDuration);
        audio.addEventListener('durationchange', onDuration);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onDuration);
            audio.removeEventListener('durationchange', onDuration);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        initAudioContext();
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
    };

    const handleSeek = (val: number[]) => {
        if (audioRef.current && isFinite(val[0])) {
            audioRef.current.currentTime = val[0];
            setCurrentTime(val[0]);
        }
    };

    const handleVolume = (val: number[]) => {
        const v = val[0];
        setVolume(v);
        if (audioRef.current) {
            audioRef.current.volume = v / 100;
        }
        if (v > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (audioRef.current) {
            const newMuted = !isMuted;
            audioRef.current.muted = newMuted;
            setIsMuted(newMuted);
        }
    };

    const skip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
        }
    };

    const toggleLoop = () => {
        setIsLooping(prev => {
            if (audioRef.current) audioRef.current.loop = !prev;
            return !prev;
        });
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex flex-col h-full">
            <audio ref={audioRef} src={url} preload="metadata" crossOrigin="anonymous" />

            {/* Top bar — title + actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-white truncate flex-1 pr-4 leading-tight">{title}</h2>
                <div className="flex items-center gap-1">
                    {downloadUrl && (
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9" asChild>
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    {externalUrl && (
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9" asChild>
                            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Visualizer + artwork area */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0">
                    <div
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                            background: `
                                radial-gradient(ellipse at 20% 50%, hsla(152, 60%, 20%, ${isPlaying ? 0.4 : 0.15}) 0%, transparent 60%),
                                radial-gradient(ellipse at 80% 50%, hsla(200, 60%, 15%, ${isPlaying ? 0.3 : 0.1}) 0%, transparent 60%),
                                radial-gradient(ellipse at 50% 80%, hsla(270, 50%, 12%, 0.2) 0%, transparent 50%)
                            `
                        }}
                    />
                </div>

                {/* Visualizer canvas */}
                <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10">
                    <AudioVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
                </div>

                {/* Center artwork */}
                <div className="relative z-20 flex flex-col items-center gap-6">
                    <div className={`
                        w-44 h-44 md:w-56 md:h-56 rounded-[2.5rem] 
                        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                        border border-white/10
                        flex items-center justify-center
                        shadow-2xl shadow-black/50
                        backdrop-blur-sm
                        transition-transform duration-700 ease-out
                        ${isPlaying ? 'scale-100 rotate-0' : 'scale-95 rotate-[-2deg]'}
                    `}>
                        <div className={`
                            w-20 h-20 md:w-24 md:h-24 rounded-full 
                            bg-gradient-to-br from-emerald-500/20 to-teal-500/10
                            flex items-center justify-center
                            transition-all duration-700
                            ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}
                        `}>
                            <Music className="h-10 w-10 md:h-12 md:w-12 text-emerald-400/60" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="px-6 pt-4 pb-2">
                <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.5}
                    onValueChange={handleSeek}
                    className="w-full cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-emerald-400 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-emerald-400/30 [&_.range]:bg-gradient-to-r [&_.range]:from-emerald-500 [&_.range]:to-teal-400 [&_[data-orientation=horizontal]>.range]:bg-gradient-to-r [&_[data-orientation=horizontal]>.range]:from-emerald-500 [&_[data-orientation=horizontal]>.range]:to-teal-400"
                />
                <div className="flex items-center justify-between mt-2 text-[11px] text-white/40 font-mono tabular-nums tracking-wider">
                    <span>{formatTime(currentTime)}</span>
                    <span>{isLoaded ? formatTime(duration) : '--:--'}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 pb-6 pt-2">
                <div className="flex items-center justify-between">
                    {/* Left — loop */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleLoop}
                        className={`h-10 w-10 rounded-xl transition-all ${isLooping ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                    >
                        <Repeat className="h-4 w-4" />
                    </Button>

                    {/* Center — transport controls */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => skip(-10)}
                            className="h-11 w-11 text-white/70 hover:text-white hover:bg-white/5 rounded-xl"
                        >
                            <SkipBack className="h-5 w-5" />
                        </Button>

                        <Button
                            size="icon"
                            onClick={togglePlay}
                            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-400/40 transition-all hover:scale-105 active:scale-95 border-0"
                        >
                            {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => skip(10)}
                            className="h-11 w-11 text-white/70 hover:text-white hover:bg-white/5 rounded-xl"
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Right — volume */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                            className="h-10 w-10 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl"
                        >
                            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <div className="w-20 hidden sm:block">
                            <Slider
                                value={[isMuted ? 0 : volume]}
                                max={100}
                                step={1}
                                onValueChange={handleVolume}
                                className="cursor-pointer [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-white/80 [&_[role=slider]]:border-0"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MediaPlayer({ isOpen, onClose, title, url, type }: MediaPlayerProps) {
    const resolvedUrl = resolveMediaUrl(url);
    const externalUrl = resolveExternalUrl(url);
    const downloadUrl = resolveDownloadUrl(url);

    // Determine if we can use native player (IA or Supabase URLs)
    const isNativePlayable = url ? (url.includes('ia://') || (!url.includes('drive.google.com'))) : false;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg w-full h-[85vh] max-h-[640px] flex flex-col p-0 overflow-hidden bg-zinc-950 text-white border border-white/[0.06] rounded-3xl shadow-2xl shadow-black/80 gap-0 [&>button]:hidden">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                    <X className="h-4 w-4" />
                </button>

                {!resolvedUrl ? (
                    /* No URL fallback */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                            <Music className="h-12 w-12 text-white/10" />
                        </div>
                        <p className="text-white/40 text-lg mb-6">Unable to load this content</p>
                        {externalUrl && (
                            <Button variant="outline" className="rounded-2xl border-white/10 text-white hover:bg-white/5" asChild>
                                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" /> Open Externally
                                </a>
                            </Button>
                        )}
                    </div>
                ) : type === 'audio' && isNativePlayable ? (
                    /* ✨ Premium Custom Audio Player */
                    <CustomAudioPlayer
                        url={resolvedUrl}
                        title={title}
                        externalUrl={externalUrl}
                        downloadUrl={downloadUrl}
                    />
                ) : type === 'book' ? (
                    /* Book viewer */
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white truncate flex-1 pr-4">{title}</h2>
                        </div>
                        <iframe
                            src={resolvedUrl}
                            className="flex-1 w-full border-none"
                            title={title}
                        />
                    </div>
                ) : type === 'video' ? (
                    /* Video player */
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white truncate flex-1 pr-4">{title}</h2>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-black">
                            <video
                                src={resolvedUrl}
                                controls
                                autoPlay
                                className="max-w-full max-h-full"
                            />
                        </div>
                    </div>
                ) : type === 'audio' ? (
                    /* Audio fallback (e.g. non-streamable) */
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white truncate flex-1 pr-4">{title}</h2>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                            <div className="w-48 h-48 rounded-3xl bg-white/5 flex items-center justify-center">
                                <Music className="h-20 w-20 text-white/10" />
                            </div>
                            <audio
                                src={resolvedUrl}
                                controls
                                autoPlay
                                className="w-full max-w-md"
                            />
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
