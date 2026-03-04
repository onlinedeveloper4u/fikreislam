/**
 * Global audio store — a lightweight pub/sub for persistent audio state.
 * This runs client-side and survives Astro view transitions.
 */

export interface AudioTrack {
    id: string;
    title: string;
    author?: string;
    url: string;
    coverUrl?: string;
}

interface AudioState {
    track: AudioTrack | null;
    isPlaying: boolean;
}

type Listener = (state: AudioState) => void;

const listeners = new Set<Listener>();
let state: AudioState = { track: null, isPlaying: false };

function emit() {
    listeners.forEach((fn) => fn({ ...state }));
}

export const audioStore = {
    getState: () => state,

    subscribe: (fn: Listener) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },

    play: (track: AudioTrack) => {
        state = { track, isPlaying: true };
        emit();
    },

    toggle: () => {
        state = { ...state, isPlaying: !state.isPlaying };
        emit();
    },

    pause: () => {
        state = { ...state, isPlaying: false };
        emit();
    },

    stop: () => {
        state = { track: null, isPlaying: false };
        emit();
    },
};
