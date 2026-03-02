import React from 'react';

export const SkeletonPulse = ({ className = '' }) => (
    <div className={`animate-skeleton bg-gradient-to-r from-border/40 via-border/70 to-border/40 bg-[length:200%_100%] rounded ${className}`} />
);

export const SkeletonCard = () => (
    <div className="glass-card p-6 space-y-4">
        <SkeletonPulse className="h-4 w-1/3" />
        <SkeletonPulse className="h-8 w-2/3" />
        <SkeletonPulse className="h-3 w-1/2" />
    </div>
);

export const SkeletonRow = () => (
    <div className="flex items-center justify-between p-3 rounded-xl">
        <div className="space-y-2 flex-1">
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-3 w-16" />
        </div>
        <div className="space-y-2 text-right">
            <SkeletonPulse className="h-4 w-24 ml-auto" />
            <SkeletonPulse className="h-3 w-16 ml-auto" />
        </div>
    </div>
);

export const SkeletonChart = () => (
    <div className="glass-card p-6 space-y-4">
        <SkeletonPulse className="h-5 w-32" />
        <div className="flex items-end gap-2 h-[200px]">
            {[40, 60, 35, 80, 55, 70, 45, 90, 65, 50].map((h, i) => (
                <SkeletonPulse key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
            ))}
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
            <SkeletonPulse className="h-4 w-32" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border/30">
                <SkeletonPulse className="h-6 w-16" />
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-4 w-12 ml-auto" />
                <SkeletonPulse className="h-4 w-20" />
            </div>
        ))}
    </div>
);
