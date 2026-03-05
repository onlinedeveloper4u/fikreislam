import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, X, Music, ChevronUp, ChevronDown, Check, Gauge } from 'lucide-react';
import { audioStore } from '../lib/audioStore';

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function GlobalAudioPlayer() {
    const state = useSyncExternalStore(audioStore.subscribe, audioStore.getState, audioStore.getState);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(80);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

    // Sync audio element with store state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (state.track) {
            if (audio.src !== state.track.url) {
                audio.src = state.track.url;
                audio.load();
                audio.playbackRate = playbackRate;
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
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

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
                    className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 pb-2 sm:pb-4 pointer-events-none"
                >
                    <div className="max-w-4xl mx-auto pointer-events-auto relative">

                        {/* Outside click handler for Speed Menu */}
                        {speedMenuOpen && (
                            <div
                                className="fixed inset-0 z-65"
                                onClick={() => setSpeedMenuOpen(false)}
                            />
                        )}

                        {/* Speed Dropdown Overlay */}
                        <AnimatePresence>
                            {speedMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-18 right-4 sm:right-0 z-70 bg-white border border-slate-900/10 rounded-2xl shadow-2xl p-2 w-36 overflow-hidden"
                                >
                                    <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider border-b border-slate-900/5 mb-1 text-right">رقتار</div>
                                    <div className="flex flex-col gap-1">
                                        {PLAYBACK_SPEEDS.map((speed) => (
                                            <button
                                                key={speed}
                                                onClick={() => {
                                                    setPlaybackRate(speed);
                                                    setSpeedMenuOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${playbackRate === speed
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className="font-sans leading-none">{speed}x</span>
                                                {playbackRate === speed && <Check className="w-3.5 h-3.5" />}
                                                {speed === 1 && playbackRate !== 1 && <span className="text-[9px] opacity-40 font-urdu leading-none">عام</span>}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Expanded View */}
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    className="glass-heavy rounded-3xl border border-slate-900/10 mb-2 p-6 overflow-hidden relative shadow-2xl"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                                    {/* Top Controls (Dismiss) */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            onClick={() => audioStore.stop()}
                                            className="w-10 h-10 rounded-full bg-slate-900/5 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center border border-transparent hover:border-red-100"
                                            aria-label="Dismiss Player"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Track Artwork */}
                                    <div className="flex flex-col items-center gap-4 mb-6">
                                        <div className="w-32 h-32 rounded-2xl bg-linear-to-br from-emerald-500/10 to-slate-900/5 backdrop-blur-md flex items-center justify-center shadow-inner relative group">
                                            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl group-hover:bg-emerald-500/10 transition-colors" />
                                            <Music className="w-14 h-14 text-emerald-600/20" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-urdu text-slate-900 font-bold text-lg leading-snug line-clamp-1 px-4">{state.track.title}</h3>
                                            {state.track.author && (
                                                <p className="text-slate-900/40 text-sm mt-1">{state.track.author}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Full Controls */}
                                    <div className="space-y-6">
                                        {/* Seek */}
                                        <div className="px-2">
                                            <div className="relative h-6 flex items-center group">
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={duration || 100}
                                                    step={0.1}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    className="w-full h-1.5 accent-emerald-600 cursor-pointer bg-slate-200 rounded-full appearance-none transition-all"
                                                />
                                            </div>
                                            <div className="flex justify-between text-[11px] text-slate-900/40 font-sans font-medium mt-1 px-1 leading-none">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                        </div>

                                        {/* Transport Controls Grid */}
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center justify-center gap-8">
                                                <button
                                                    onClick={() => skip(-10)}
                                                    className="group relative p-3 text-slate-900/40 hover:text-emerald-600 transition-all active:scale-90"
                                                    aria-label="Skip back 10 seconds"
                                                >
                                                    <RotateCcw className="w-6 h-6" />
                                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-sans font-bold leading-none">10</span>
                                                </button>

                                                <button
                                                    onClick={() => audioStore.toggle()}
                                                    className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    {state.isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                                                </button>

                                                <button
                                                    onClick={() => skip(10)}
                                                    className="group relative p-3 text-slate-900/40 hover:text-emerald-600 transition-all active:scale-90"
                                                    aria-label="Skip forward 10 seconds"
                                                >
                                                    <RotateCw className="w-6 h-6" />
                                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-sans font-bold leading-none">10</span>
                                                </button>
                                            </div>

                                            {/* Bottom Options Row */}
                                            <div className="flex items-center justify-between px-2 pt-2">
                                                {/* Playback Speed (Trigger) */}
                                                <button
                                                    onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${speedMenuOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-900/5 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    <Gauge className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-sans font-bold leading-none">{playbackRate}x</span>
                                                </button>

                                                {/* Volume */}
                                                <div className="flex items-center gap-3">
                                                    <button onClick={toggleMute} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                    </button>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        value={isMuted ? 0 : volume}
                                                        onChange={handleVolume}
                                                        className="w-20 sm:w-24 h-1 accent-emerald-500 cursor-pointer bg-slate-200 rounded-full appearance-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Compact Bar */}
                        <div className="glass-heavy border border-slate-900/10 rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden relative">
                            {/* Hidden progress line */}
                            <div className="h-1 bg-slate-100 relative group cursor-pointer" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                if (audioRef.current) audioRef.current.currentTime = pos * duration;
                            }}>
                                <div
                                    className="h-full bg-emerald-500 transition-[width] duration-300 relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-600 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                            </div>

                            <div className="px-4 flex items-center gap-3 h-16 sm:h-20">
                                {/* Track info */}
                                <div className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 shrink-0 flex items-center justify-center shadow-sm">
                                        <Music className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600/40" />
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="font-urdu text-slate-900 text-sm font-bold truncate">{state.track.title}</p>
                                        {state.track.author && (
                                            <p className="text-slate-900/40 text-[11px] font-medium truncate mt-0.5">{state.track.author}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => skip(-10)}
                                        className="p-2.5 text-slate-400 hover:text-emerald-600 transition-all active:scale-90 hidden xs:flex relative"
                                        aria-label="Skip back"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-sans font-bold leading-none">10</span>
                                    </button>

                                    <button
                                        onClick={() => audioStore.toggle()}
                                        className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-90 transition-all"
                                    >
                                        {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                    </button>

                                    <button
                                        onClick={() => skip(10)}
                                        className="p-2.5 text-slate-400 hover:text-emerald-600 transition-all active:scale-90 hidden xs:flex relative"
                                        aria-label="Skip forward"
                                    >
                                        <RotateCw className="w-5 h-5" />
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-sans font-bold leading-none">10</span>
                                    </button>
                                </div>

                                {/* Speed, Toggle & Dismiss */}
                                <div className="flex items-center gap-1 ml-2 border-r border-slate-900/5 pr-1">
                                    <button
                                        onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                                        className={`w-10 h-10 flex items-center justify-center text-[10px] font-sans font-bold rounded-xl transition-all leading-none ${speedMenuOpen ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}
                                    >
                                        {playbackRate}x
                                    </button>
                                    <button
                                        onClick={() => setExpanded(!expanded)}
                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => audioStore.stop()}
                                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    );
}
