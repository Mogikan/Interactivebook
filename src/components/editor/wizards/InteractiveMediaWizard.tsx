import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { MDXEditor } from '../MDXEditor';
import type { ExerciseComponent } from '../../../utils/mdxParser';
import { Play, Pause, Plus, Trash2, Clock, Film, Music, RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';

interface InteractiveMediaWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

interface CheckpointData {
    time: string;
    content: string;
}

export const InteractiveMediaWizard: React.FC<InteractiveMediaWizardProps> = ({ component, onSave, onCancel }) => {
    const [src, setSrc] = useState('');
    const [type, setType] = useState<'audio' | 'video'>('video');
    const [checkpoints, setCheckpoints] = useState<CheckpointData[]>([]);
    const [editingCheckpointIndex, setEditingCheckpointIndex] = useState<number | null>(null);
    const [tempContent, setTempContent] = useState('');
    const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

    // Media state
    const playerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        setSrc(component.props.src || '');
        setType(component.props.type || 'video');

        // Parse existing checkpoints from children
        if (component.children) {
            // This is a rough parser for existing checkpoints
            // We look for <Checkpoint time="...">...</Checkpoint>
            const regex = /<Checkpoint\s+time="([^"]+)"\s*>([\s\S]*?)<\/Checkpoint>/g;
            const newCheckpoints: CheckpointData[] = [];
            let match;
            while ((match = regex.exec(component.children)) !== null) {
                newCheckpoints.push({
                    time: match[1],
                    content: match[2].trim()
                });
            }
            setCheckpoints(newCheckpoints);
        }
    }, []);

    // Imperative control for native audio element
    useEffect(() => {
        if (type === 'audio' && playerRef.current instanceof HTMLAudioElement) {
            if (isPlaying) {
                playerRef.current.play().catch((e: any) => console.error('Wizard: Audio play failed:', e));
            } else {
                playerRef.current.pause();
            }
        }
    }, [isPlaying, type]);

    const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        setCurrentTime(state.playedSeconds);
    };

    const handleDuration = () => {
        const player = playerRef.current;
        if (!player) return;

        const d = player.duration;
        if (Number.isFinite(d) && d > 0) {
            setDuration(d);
        }
    };

    const setPlayerRef = React.useCallback((player: HTMLVideoElement | HTMLAudioElement | null) => {
        if (!player) return;
        playerRef.current = player;
    }, []);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        if (!Number.isFinite(time) || isNaN(time)) return "00:00,000";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };

    const formatTimeShort = (time: number) => {
        if (!Number.isFinite(time) || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const addCheckpoint = () => {
        // Pause video before opening editor
        setIsPlaying(false);

        const timeStr = formatTime(currentTime);
        const newCheckpoint = {
            time: timeStr,
            content: '<Quiz answer="1">\n  Question?\n  <Option>Answer</Option>\n</Quiz>'
        };
        const newCheckpoints = [...checkpoints, newCheckpoint];
        setCheckpoints(newCheckpoints);

        // Open editor for the newly created checkpoint
        const newIndex = newCheckpoints.length - 1;
        setEditingCheckpointIndex(newIndex);
        setTempContent(newCheckpoint.content);
    };

    const updateCheckpoint = (index: number, field: keyof CheckpointData, value: string) => {
        const newCheckpoints = [...checkpoints];
        newCheckpoints[index] = { ...newCheckpoints[index], [field]: value };
        setCheckpoints(newCheckpoints);
    };

    const removeCheckpoint = (index: number) => {
        setCheckpoints(checkpoints.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        // Generate children string with checkpoints sorted by time
        const children = checkpoints
            .sort((a, b) => {
                const timeA = parseTimeToSeconds(a.time);
                const timeB = parseTimeToSeconds(b.time);
                return timeA - timeB;
            })
            .map(cp => `  <Checkpoint time="${cp.time}">\n    ${cp.content}\n  </Checkpoint>`)
            .join('\n');

        onSave({
            ...component,
            props: {
                src,
                type
            },
            children
        });
    };

    const openCheckpointEditor = (index: number) => {
        setEditingCheckpointIndex(index);
        setTempContent(checkpoints[index].content);
        setShowUnsavedConfirm(false);
    };

    const closeCheckpointEditor = () => {
        if (tempContent !== checkpoints[editingCheckpointIndex!].content) {
            setShowUnsavedConfirm(true);
        } else {
            setEditingCheckpointIndex(null);
        }
    };

    const confirmClose = (save: boolean) => {
        if (save) {
            updateCheckpoint(editingCheckpointIndex!, 'content', tempContent);
        }
        setEditingCheckpointIndex(null);
        setShowUnsavedConfirm(false);
    };

    // Helper to parse time string to seconds for positioning
    const parseTimeToSeconds = (timeStr: string) => {
        const parts = timeStr.replace(',', '.').split(':');
        let seconds = 0;
        if (parts.length === 3) seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        else if (parts.length === 2) seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        else seconds = parseFloat(parts[0]);
        return seconds;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            {/* Main Wizard Modal */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative">
                {/* ... Header ... */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Film className="text-pink-500" />
                        Interactive Media Editor
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20 transition-all">
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Media Player & Controls */}
                    <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-800 flex flex-col gap-6 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">

                        {/* Source Configuration */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Media Type</label>
                                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                                    <button
                                        onClick={() => setType('video')}
                                        className={clsx(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                            type === 'video' ? "bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        <Film size={16} /> Video
                                    </button>
                                    <button
                                        onClick={() => setType('audio')}
                                        className={clsx(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                            type === 'audio' ? "bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        <Music size={16} /> Audio
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Source URL</label>
                                <input
                                    value={src}
                                    onChange={e => setSrc(e.target.value)}
                                    placeholder="/assets/video.mp4"
                                    className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Player */}
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 relative group">
                            {src ? (
                                <div className={clsx(
                                    "w-full flex items-center justify-center bg-black",
                                    type === 'video' ? "aspect-video" : "h-24"
                                )}>
                                    {type === 'audio' ? (
                                        <audio
                                            ref={playerRef}
                                            src={src}
                                            controls
                                            className="w-full px-4"
                                            onTimeUpdate={(e) => {
                                                const time = e.currentTarget.currentTime;
                                                setCurrentTime(time);
                                            }}
                                            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                                            onEnded={() => setIsPlaying(false)}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                        />
                                    ) : (
                                        <ReactPlayer
                                            key={src} // Force remount
                                            ref={setPlayerRef}
                                            src={src}
                                            playing={isPlaying}
                                            controls={false}
                                            width="100%"
                                            height="100%"
                                            className="react-player"
                                            progressInterval={100}
                                            onProgress={handleProgress as any}
                                            onDurationChange={handleDuration}
                                            // @ts-ignore - onTimeUpdate is passed to native video element
                                            onTimeUpdate={(e) => {
                                                if (e.target && typeof (e.target as any).currentTime === 'number') {
                                                    setCurrentTime((e.target as any).currentTime);
                                                }
                                            }}
                                            onEnded={() => setIsPlaying(false)}
                                            onReady={() => { }}
                                            onError={(e) => console.error('Wizard: Player Error', e)}
                                            config={{
                                                youtube: {
                                                    playerVars: {
                                                        showinfo: 0,
                                                        controls: 0,
                                                        modestbranding: 1,
                                                        rel: 0,
                                                        iv_load_policy: 3,
                                                        fs: 0,
                                                        origin: typeof window !== 'undefined' ? window.location.origin : undefined
                                                    }
                                                } as any
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="w-full aspect-video flex items-center justify-center text-gray-500">
                                    No source selected
                                </div>
                            )}

                            {/* Big Play Button Overlay (Video Only) */}
                            {src && !isPlaying && type === 'video' && (
                                <div
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 cursor-pointer"
                                    onClick={togglePlay}
                                >
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
                                        <Play size={32} className="text-white fill-white ml-1" />
                                    </div>
                                </div>
                            )}

                            {/* Custom Controls */}
                            {src && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                    {/* Seek Slider Container */}
                                    <div className="relative w-full h-4 flex items-center">
                                        {/* Checkpoint Markers */}
                                        {checkpoints.map((cp, idx) => {
                                            const seconds = parseTimeToSeconds(cp.time);
                                            const percent = (seconds / (duration || 1)) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black z-20 cursor-pointer hover:scale-125 transition-transform"
                                                    style={{ left: `${percent}%` }}
                                                    title={`Checkpoint at ${cp.time}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openCheckpointEditor(idx);
                                                    }}
                                                />
                                            );
                                        })}

                                        {/* Slider */}
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            value={currentTime || 0}
                                            onChange={(e) => {
                                                const time = parseFloat(e.target.value);
                                                setCurrentTime(time);
                                                const player = playerRef.current;
                                                if (player) {
                                                    player.currentTime = time;
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all z-10"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                            </button>
                                            <span className="text-sm font-mono">
                                                {formatTimeShort(currentTime)} / {formatTimeShort(duration)}
                                            </span>
                                        </div>
                                        <button onClick={() => {
                                            const player = playerRef.current;
                                            if (player) {
                                                player.currentTime = 0;
                                                setCurrentTime(0);
                                            }
                                        }} className="hover:text-blue-400">
                                            <RotateCcw size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Checkpoint Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={addCheckpoint}
                                disabled={!src}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={20} />
                                <Clock size={20} />
                                <span>Add Checkpoint at {formatTimeShort(currentTime)}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Checkpoints List */}
                    <div className="w-1/2 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Checkpoints ({checkpoints.length})</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {checkpoints.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No checkpoints yet.</p>
                                    <p className="text-sm">Play the media and click "Add Checkpoint" to create one.</p>
                                </div>
                            ) : (
                                checkpoints.map((cp, idx) => (
                                    <div key={idx} className={clsx(
                                        "border rounded-xl p-4 transition-colors group",
                                        editingCheckpointIndex === idx ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-blue-300 dark:hover:border-blue-700"
                                    )}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono font-bold border border-blue-200 dark:border-blue-800">
                                                    {cp.time}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const seconds = parseTimeToSeconds(cp.time);
                                                        const player = playerRef.current;
                                                        if (player) {
                                                            player.currentTime = seconds;
                                                            setCurrentTime(seconds);
                                                        }
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-blue-500 underline"
                                                >
                                                    Jump to
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    value={cp.time}
                                                    onChange={e => updateCheckpoint(idx, 'time', e.target.value)}
                                                    className="w-24 px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-700 font-mono"
                                                    placeholder="00:00:00,000"
                                                />
                                                <button
                                                    onClick={() => removeCheckpoint(idx)}
                                                    className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete Checkpoint"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="w-full h-20 p-3 text-sm font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden opacity-75">
                                                {cp.content.substring(0, 100)}...
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openCheckpointEditor(idx)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-medium transform hover:scale-105 transition-all"
                                                >
                                                    Edit Content
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Checkpoint Content Editor Modal */}
            {editingCheckpointIndex !== null && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="text-lg font-bold">Edit Checkpoint Content</h3>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-mono text-gray-500">
                                    Time: {checkpoints[editingCheckpointIndex].time}
                                </div>
                                <button
                                    onClick={closeCheckpointEditor}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-0 relative">
                            <MDXEditor
                                value={tempContent}
                                onChange={setTempContent}
                                className="h-full"
                            />
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button
                                onClick={closeCheckpointEditor}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmClose(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20 transition-all"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsaved Changes Confirmation */}
            {showUnsavedConfirm && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold mb-2">Unsaved Changes</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            You have unsaved changes in the checkpoint editor. Do you want to apply them before closing?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => confirmClose(false)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => confirmClose(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
