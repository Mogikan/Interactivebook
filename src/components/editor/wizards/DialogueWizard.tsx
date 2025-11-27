import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Play, ArrowUp, ArrowDown, Volume2, Save, Edit } from 'lucide-react';
import type { ExerciseComponent } from '../../../utils/mdxParser';
import { MDXEditor } from '../../editor/MDXEditor';

interface DialogueWizardProps {
    component: ExerciseComponent;
    onSave: (component: ExerciseComponent) => void;
    onCancel: () => void;
}

interface DialogueLine {
    speaker: string;
    text: string; // Markdown content
    side: 'left' | 'right';
    voice?: string;
}

export const DialogueWizard: React.FC<DialogueWizardProps> = ({ component, onSave, onCancel }) => {
    const [lines, setLines] = useState<DialogueLine[]>([]);
    const [speakers, setSpeakers] = useState<{ name: string; defaultSide: 'left' | 'right'; defaultVoice?: string }[]>([]);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Editor state
    const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
    const [tempContent, setTempContent] = useState('');

    // Helper to parse props string like: answer="2" multiple={true}
    const parsePropsString = (propsString: string): Record<string, any> => {
        const props: Record<string, any> = {};
        const regex = /(\w+)=(?:["']([^"']*)["']|{([^}]*)})/g;
        let match;
        while ((match = regex.exec(propsString)) !== null) {
            const key = match[1];
            const value = match[2] || match[3];
            props[key] = value;
        }
        return props;
    };

    // Load initial data
    useEffect(() => {
        const loadData = () => {
            let initialLines: DialogueLine[] = [];

            // 1. Try parsing children (Message components)
            if (component.children && component.children.trim().length > 0) {
                const messageRegex = /<Message(\s+[^>]*)?>([\s\S]*?)<\/Message>/g;
                let match;
                while ((match = messageRegex.exec(component.children)) !== null) {
                    const propsStr = match[1] || '';
                    const content = match[2].trim(); // Inner MDX content
                    const props = parsePropsString(propsStr);

                    initialLines.push({
                        speaker: props.speaker || 'Unknown',
                        text: content,
                        side: (props.side as 'left' | 'right') || 'left',
                        voice: props.voice
                    });
                }
            }
            // 2. Fallback to legacy 'lines' prop
            else if (component.props.lines && Array.isArray(component.props.lines)) {
                initialLines = component.props.lines as DialogueLine[];
            }

            // If no data found, set defaults
            if (initialLines.length === 0) {
                initialLines = [
                    { speaker: 'Anna', text: 'Hallo!', side: 'left' },
                    { speaker: 'Markus', text: 'Hi! Wie geht es dir?', side: 'right' }
                ];
            }

            setLines(initialLines);

            // Extract speakers from lines
            const uniqueSpeakers = Array.from(new Set(initialLines.map(l => l.speaker)));
            const initialSpeakers = uniqueSpeakers.map(name => ({
                name,
                defaultSide: (initialLines.find(l => l.speaker === name)?.side || 'left') as 'left' | 'right',
                defaultVoice: initialLines.find(l => l.speaker === name)?.voice
            }));

            // Ensure at least default speakers exist if none found
            if (initialSpeakers.length === 0) {
                setSpeakers([
                    { name: 'Anna', defaultSide: 'left' },
                    { name: 'Markus', defaultSide: 'right' }
                ]);
            } else {
                setSpeakers(initialSpeakers);
            }
        };

        loadData();

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
        const nextSpeaker = speakers.find(s => s.name !== lastSpeaker) || speakers[0] || { name: 'Speaker', defaultSide: 'left' };

        const newLine: DialogueLine = {
            speaker: nextSpeaker.name,
            text: '',
            side: nextSpeaker.defaultSide as 'left' | 'right',
            voice: nextSpeaker.defaultVoice
        };

        setLines([...lines, newLine]);

        // Automatically open editor for new line
        setEditingLineIndex(lines.length);
        setTempContent('');
    };

    const updateLine = (index: number, field: keyof DialogueLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

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
        // Strip markdown/html tags for simple preview if possible, or just speak raw text
        // For better experience, we might want a helper to strip tags
        const textToSpeak = (line.text || '').replace(/<[^>]*>/g, '');

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'de-DE';
        if (line.voice) {
            const voice = availableVoices.find(v => v.name === line.voice);
            if (voice) utterance.voice = voice;
        } else {
            const speakerConfig = speakers.find(s => s.name === line.speaker);
            if (speakerConfig?.defaultVoice) {
                const voice = availableVoices.find(v => v.name === speakerConfig.defaultVoice);
                if (voice) utterance.voice = voice;
            }
        }
        window.speechSynthesis.speak(utterance);
    };

    const openEditor = (index: number) => {
        setEditingLineIndex(index);
        setTempContent(lines[index].text || '');
    };

    const saveEditorContent = () => {
        if (editingLineIndex !== null) {
            updateLine(editingLineIndex, 'text', tempContent);
            setEditingLineIndex(null);
            setTempContent('');
        }
    };

    const handleSave = () => {
        // Generate children string
        const childrenStr = lines.map(line => {
            const props = [
                `speaker="${line.speaker}"`,
                `side="${line.side}"`,
                line.voice ? `voice="${line.voice}"` : ''
            ].filter(Boolean).join(' ');

            return `  <Message ${props}>\n    ${line.text}\n  </Message>`;
        }).join('\n');

        const newComponent: ExerciseComponent = {
            ...component,
            type: 'Dialogue',
            props: {}, // Clear legacy props
            children: childrenStr
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
        const newSpeakers = [...speakers];
        newSpeakers[index] = { ...newSpeakers[index], name: newName };
        setSpeakers(newSpeakers);

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
        setSpeakers(speakers.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] w-full relative">
            {/* Main Wizard Content */}
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

                                    <div className="flex gap-2">
                                        <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 min-h-[60px] max-h-[100px] overflow-hidden text-sm text-gray-600 dark:text-gray-300">
                                            {line.text || <span className="text-gray-400 italic">Empty content...</span>}
                                        </div>
                                        <button
                                            onClick={() => openEditor(idx)}
                                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs font-medium"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                    </div>
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

            {/* Content Editor Modal */}
            {editingLineIndex !== null && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-in fade-in duration-200">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-bold text-lg">Edit Message Content</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditingLineIndex(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEditorContent}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <MDXEditor
                            value={tempContent}
                            onChange={setTempContent}
                            className="h-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
