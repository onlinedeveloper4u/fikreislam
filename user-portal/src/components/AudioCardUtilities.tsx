import React from 'react';

export const getFileSizeParts = (size: string | number | null) => {
    if (!size) return null;
    const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
    if (isNaN(bytes)) return { value: size.toString(), unit: '' };

    if (bytes < 1024 * 1024) {
        return { value: (bytes / 1024).toFixed(1), unit: 'کے بی' };
    } else if (bytes < 1024 * 1024 * 1024) {
        return { value: (bytes / (1024 * 1024)).toFixed(1), unit: 'ایم بی' };
    } else {
        return { value: (bytes / (1024 * 1024 * 1024)).toFixed(1), unit: 'جی بی' };
    }
};

export const Waveform = () => (
    <div className="flex items-center gap-0.5 h-4 text-white">
        <div className="waveform-line h-2 bg-current" style={{ animationDelay: '0s' }} />
        <div className="waveform-line h-4 bg-current" style={{ animationDelay: '0.2s' }} />
        <div className="waveform-line h-3 bg-current" style={{ animationDelay: '0.4s' }} />
        <div className="waveform-line h-2 bg-current" style={{ animationDelay: '0.1s' }} />
    </div>
);
