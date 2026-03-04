import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { audioStore } from '../lib/audioStore';

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GlobalAudioPlayer() {
    const state = useSyncExternalStore(audioStore.subscribe, audioStore.getState, audioStore.getState);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Sync audio element with store state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (state.track) {
            if (audio.src !== state.track.url) {
                audio.src = state.track.url;
                audio.load();
            }
            if (state.isPlaying) {
                audio.play().catch(console.error);
            } else {
                audio.pause();
            }
        } else {
            audio.pause();
            audio.src = '';
        }
    }, [state.track?.url, state.isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDuration = () => {
            if (isFinite(audio.duration)) setDuration(audio.duration);
        };
        const onEnded = () => audioStore.pause();

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onDuration);
        audio.addEventListener('durationchange', onDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onDuration);
            audio.removeEventListener('durationchange', onDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current && isFinite(val)) {
            audioRef.current.currentTime = val;
            setCurrentTime(val);
        }
    }, []);

    const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v / 100;
        if (v > 0) setIsMuted(false);
    }, []);

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            const newMuted = !isMuted;
            audioRef.current.muted = newMuted;
            setIsMuted(newMuted);
        }
    }, [isMuted]);

    const skip = useCallback((seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
        }
    }, [duration]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!state.track) return <audio ref={audioRef} preload="none" />;

    return (
        <>
            <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />

            <AnimatePresence>
                <motion.div
                    key="audio-player"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-50"
                >
                    {/* Expanded View */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="glass-heavy rounded-t-3xl border-t border-x border-slate-900/10 mx-2 sm:mx-4 mb-0 p-6"
                            >
                                {/* Track Artwork */}
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    <div className="w-32 h-32 rounded-2xl gradient-emerald flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                        <Music className="w-14 h-14 text-slate-900/60" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-slate-900 font-bold text-lg leading-tight">{state.track.title}</h3>
                                        {state.track.author && (
                                            <p className="text-slate-900/40 text-sm mt-1">{state.track.author}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Full Controls */}
                                <div className="space-y-4">
                                    {/* Seek */}
                                    <div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            step={0.5}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="w-full h-1 accent-emerald-glow cursor-pointer bg-slate-900/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-glow [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-400/40"
                                        />
                                        <div className="flex justify-between text-[11px] text-slate-900/30 font-mono mt-1">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    {/* Transport */}
                                    <div className="flex items-center justify-center gap-4">
                                        <button onClick={() => skip(-10)} className="p-2 text-slate-900/50 hover:text-slate-900 transition-colors">
                                            <SkipBack className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => audioStore.toggle()}
                                            className="w-14 h-14 rounded-full gradient-emerald-glow flex items-center justify-center text-slate-900 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            {state.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                        </button>
                                        <button onClick={() => skip(10)} className="p-2 text-slate-900/50 hover:text-slate-900 transition-colors">
                                            <SkipForward className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Volume */}
                                    <div className="flex items-center gap-3 justify-center">
                                        <button onClick={toggleMute} className="text-slate-900/40 hover:text-slate-900/70 transition-colors">
                                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolume}
                                            className="w-24 h-1 accent-white/60 cursor-pointer bg-slate-900/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900/80"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Compact Bar */}
                    <div className="glass-heavy border-t border-slate-900/5 backdrop-blur-3xl">
                        {/* Progress line */}
                        <div className="h-0.5 bg-slate-900/5">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-dim to-emerald-glow transition-[width] duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="container-app flex items-center gap-3 h-16 sm:h-18">
                            {/* Track info */}
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl gradient-emerald flex-shrink-0 flex items-center justify-center shadow-md">
                                    <Music className="w-5 h-5 text-slate-900/70" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-slate-900 text-sm font-semibold truncate leading-tight">{state.track.title}</p>
                                    {state.track.author && (
                                        <p className="text-slate-900/30 text-xs truncate">{state.track.author}</p>
                                    )}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button onClick={() => skip(-10)} className="p-2 text-slate-900/40 hover:text-slate-900/70 transition-colors hidden sm:block">
                                    <SkipBack className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => audioStore.toggle()}
                                    className="w-10 h-10 rounded-full gradient-emerald-glow flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                </button>
                                <button onClick={() => skip(10)} className="p-2 text-slate-900/40 hover:text-slate-900/70 transition-colors hidden sm:block">
                                    <SkipForward className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Expand & Close */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="p-2 text-slate-900/30 hover:text-slate-900/60 transition-colors"
                                    aria-label="Expand player"
                                >
                                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => audioStore.stop()}
                                    className="p-2 text-slate-900/20 hover:text-red-400 transition-colors"
                                    aria-label="Close player"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    );
}
