import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Play, ArrowUp, ArrowDown, Volume2, Save } from 'lucide-react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface DialogueWizardProps {
    component: ExerciseComponent;
    onSave: (component: ExerciseComponent) => void;
    onCancel: () => void;
}

interface DialogueLine {
    speaker: string;
    text: string;
    side: 'left' | 'right';
    voice?: string;
}

export const DialogueWizard: React.FC<DialogueWizardProps> = ({ component, onSave, onCancel }) => {
    const [lines, setLines] = useState<DialogueLine[]>([]);
    const [speakers, setSpeakers] = useState<{ name: string; defaultSide: 'left' | 'right'; defaultVoice?: string }[]>([]);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Load initial data
    useEffect(() => {
        if (component.props.lines) {
            // Parse existing lines
            // The props might come as a string (if parsed from MDX raw) or object
            // For simplicity, we assume we might need to parse or it's already an object if coming from our parser
            // But our parser usually returns props as strings or simple values. 
            // Complex objects like arrays might need careful handling if they are passed as strings.
            // However, for the wizard, we usually reconstruct from the component structure.

            // If we are editing, we try to use the props. 
            // If the parser handled the array correctly, good. If not, we might need to parse the raw string manually or rely on the parser's capability.
            // Assuming the parser gives us a JS object for 'lines' if it was a JSON-like prop, OR we might need to eval it.
            // Let's assume for now we get a proper array or we default to empty.

            const rawLines = component.props.lines;
            if (Array.isArray(rawLines)) {
                setLines(rawLines as DialogueLine[]);

                // Extract speakers
                const uniqueSpeakers = Array.from(new Set((rawLines as DialogueLine[]).map(l => l.speaker)));
                const initialSpeakers = uniqueSpeakers.map(name => ({
                    name,
                    defaultSide: (rawLines.find(l => l.speaker === name)?.side || 'left') as 'left' | 'right',
                    defaultVoice: rawLines.find(l => l.speaker === name)?.voice
                }));
                setSpeakers(initialSpeakers);
            }
        } else {
            // Default start
            setSpeakers([
                { name: 'Anna', defaultSide: 'left' },
                { name: 'Markus', defaultSide: 'right' }
            ]);
            setLines([
                { speaker: 'Anna', text: 'Hallo!', side: 'left' },
                { speaker: 'Markus', text: 'Hi! Wie geht es dir?', side: 'right' }
            ]);
        }

        // Load voices
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const germanVoices = voices.filter(v => v.lang.startsWith('de'));
            setAvailableVoices(germanVoices.length > 0 ? germanVoices : voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [component]);

    const handleAddLine = () => {
        const lastSpeaker = lines.length > 0 ? lines[lines.length - 1].speaker : speakers[0]?.name;
        const nextSpeaker = speakers.find(s => s.name !== lastSpeaker) || speakers[0];

        setLines([...lines, {
            speaker: nextSpeaker.name,
            text: '',
            side: nextSpeaker.defaultSide,
            voice: nextSpeaker.defaultVoice
        }]);
    };

    const updateLine = (index: number, field: keyof DialogueLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // If speaker changes, update side/voice defaults if not manually set? 
        // For now, just update the field.
        if (field === 'speaker') {
            const speakerConfig = speakers.find(s => s.name === value);
            if (speakerConfig) {
                newLines[index].side = speakerConfig.defaultSide;
                newLines[index].voice = speakerConfig.defaultVoice;
            }
        }

        setLines(newLines);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const moveLine = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            const newLines = [...lines];
            [newLines[index - 1], newLines[index]] = [newLines[index], newLines[index - 1]];
            setLines(newLines);
        } else if (direction === 'down' && index < lines.length - 1) {
            const newLines = [...lines];
            [newLines[index + 1], newLines[index]] = [newLines[index], newLines[index + 1]];
            setLines(newLines);
        }
    };

    const previewLine = (line: DialogueLine) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(line.text);
        utterance.lang = 'de-DE';
        if (line.voice) {
            const voice = availableVoices.find(v => v.name === line.voice);
            if (voice) utterance.voice = voice;
        } else {
            // Try to find a voice matching the speaker config
            const speakerConfig = speakers.find(s => s.name === line.speaker);
            if (speakerConfig?.defaultVoice) {
                const voice = availableVoices.find(v => v.name === speakerConfig.defaultVoice);
                if (voice) utterance.voice = voice;
            }
        }
        window.speechSynthesis.speak(utterance);
    };

    const handleSave = () => {
        // Clean up lines (remove empty ones?)
        // Construct the component
        const newComponent: ExerciseComponent = {
            ...component,
            type: 'Dialogue',
            props: {
                lines: lines
            }
        };
        onSave(newComponent);
    };

    // Manage Speakers
    const addSpeaker = () => {
        const baseName = "New Speaker";
        let name = baseName;
        let counter = 1;
        while (speakers.find(s => s.name === name)) {
            counter++;
            name = `${baseName} ${counter}`;
        }
        setSpeakers([...speakers, { name, defaultSide: 'left' }]);
    };

    const updateSpeakerName = (index: number, newName: string) => {
        const oldName = speakers[index].name;
        if (!newName || (newName !== oldName && speakers.find(s => s.name === newName))) {
            // Prevent empty names or duplicates (simple validation)
            // For now just don't update if duplicate, or maybe allow but it might be confusing.
            // Let's just allow typing and maybe show error if duplicate? 
            // Simplest: just update. If duplicate, it merges identity effectively.
        }

        const newSpeakers = [...speakers];
        newSpeakers[index] = { ...newSpeakers[index], name: newName };
        setSpeakers(newSpeakers);

        // Update all lines that used the old name
        const newLines = lines.map(line => {
            if (line.speaker === oldName) {
                return { ...line, speaker: newName };
            }
            return line;
        });
        setLines(newLines);
    };

    const updateSpeaker = (index: number, field: keyof typeof speakers[0], value: any) => {
        const newSpeakers = [...speakers];
        const speakerName = newSpeakers[index].name;
        newSpeakers[index] = { ...newSpeakers[index], [field]: value };
        setSpeakers(newSpeakers);

        // Automatically update all existing lines for this speaker to match the new default
        // This ensures that if the user changes the voice in the config, it applies to the whole dialogue
        if (field === 'defaultVoice' || field === 'defaultSide') {
            const targetField = field === 'defaultVoice' ? 'voice' : 'side';
            const newLines = lines.map(line => {
                if (line.speaker === speakerName) {
                    return { ...line, [targetField]: value };
                }
                return line;
            });
            setLines(newLines);
        }
    };

    const removeSpeaker = (index: number) => {
        // Optional: prevent removing if lines exist? Or just let it happen (lines will keep the name but it won't be in list)
        // Better: if removing, maybe warn? For now, just remove.
        setSpeakers(speakers.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Volume2 className="text-blue-600" />
                    Dialogue Editor
                </h2>
                <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Speaker Configuration */}
                <section className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Speakers & Voices</h3>
                        <button onClick={addSpeaker} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Plus size={14} /> Add Speaker
                        </button>
                    </div>
                    <div className="grid gap-4">
                        {speakers.map((speaker, idx) => (
                            <div key={idx} className="flex items-center gap-4 flex-wrap group">
                                <input
                                    type="text"
                                    value={speaker.name}
                                    onChange={(e) => updateSpeakerName(idx, e.target.value)}
                                    className="font-medium min-w-[120px] px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Speaker Name"
                                />
                                <select
                                    value={speaker.defaultSide}
                                    onChange={(e) => updateSpeaker(idx, 'defaultSide', e.target.value)}
                                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                </select>
                                <select
                                    value={speaker.defaultVoice || ''}
                                    onChange={(e) => updateSpeaker(idx, 'defaultVoice', e.target.value)}
                                    className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm max-w-[200px]"
                                >
                                    <option value="">Auto / Default</option>
                                    {availableVoices.map(v => (
                                        <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => removeSpeaker(idx)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Speaker"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Lines Editor */}
                <section className="space-y-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Dialogue Lines</h3>
                    <div className="space-y-3">
                        {lines.map((line, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm group">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveLine(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => moveLine(idx, 'down')}
                                            disabled={idx === lines.length - 1}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <select
                                            value={line.speaker}
                                            onChange={(e) => updateLine(idx, 'speaker', e.target.value)}
                                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm font-medium"
                                        >
                                            {speakers.map(s => (
                                                <option key={s.name} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={line.side}
                                            onChange={(e) => updateLine(idx, 'side', e.target.value)}
                                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500"
                                        >
                                            <option value="left">Left</option>
                                            <option value="right">Right</option>
                                        </select>

                                        <div className="flex-1" />

                                        <button
                                            onClick={() => previewLine(line)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            title="Preview Audio"
                                        >
                                            <Play size={16} />
                                        </button>

                                        <button
                                            onClick={() => removeLine(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Line"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <textarea
                                        value={line.text}
                                        onChange={(e) => updateLine(idx, 'text', e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                        rows={2}
                                        placeholder="Enter dialogue text..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAddLine}
                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus size={20} />
                        Add Line
                    </button>
                </section>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Save Dialogue
                </button>
            </div>
        </div>
    );
};
