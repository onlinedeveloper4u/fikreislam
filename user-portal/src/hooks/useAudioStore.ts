import { useState, useEffect } from 'react';
import { audioStore } from '../lib/audioStore';
import type { AudioTrack } from '../lib/audioStore';

interface AudioState {
    track: AudioTrack | null;
    isPlaying: boolean;
}

export function useAudioStore() {
    const [state, setState] = useState<AudioState>(audioStore.getState());

    useEffect(() => {
        const unsubscribe = audioStore.subscribe((newState: AudioState) => {
            setState(newState);
        });
        return () => { unsubscribe(); };
    }, []);

    return state;
}
