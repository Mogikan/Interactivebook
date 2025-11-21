import React, { useState, useEffect } from 'react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface FillBlanksWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

export const FillBlanksWizard: React.FC<FillBlanksWizardProps> = ({ component, onSave, onCancel }) => {
    const [text, setText] = useState('');
    const [mode, setMode] = useState('input');
    const [options, setOptions] = useState<string[]>([]);

    useEffect(() => {
        setText(component.children || '');
        setMode(component.props.mode || 'input');
        setOptions(component.props.options || []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        const newProps = {
            ...(mode !== 'input' ? { mode } : {}),
            ...(options.length > 0 ? { options } : {})
        };

        onSave({
            ...component,
            props: newProps,
            children: text
        });
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Edit FillBlanks</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Text Content</label>
                <label className="block text-sm font-medium mb-1">Text Content</label>
                <p className="text-xs text-gray-500 mb-2">Use <code>[answer]</code> for input/drag, or <code>[answer|opt1|opt2]</code> for picker.</p>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600 font-mono text-sm"
                    rows={6}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Mode</label>
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                    >
                        <option value="input">Input (Typing)</option>
                        <option value="drag">Drag & Drop</option>
                        <option value="picker">Picker (Dropdown)</option>
                    </select>
                </div>
            </div>

            {mode === 'drag' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Options (Distractors)</label>
                    <p className="text-xs text-gray-500 mb-2">Add extra words here. Correct answers are automatically included.</p>
                    {options.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                            <input
                                value={opt}
                                onChange={e => {
                                    const newOpts = [...options];
                                    newOpts[idx] = e.target.value;
                                    setOptions(newOpts);
                                }}
                                className="flex-1 p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                            />
                            <button
                                onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                className="px-2 text-red-500 hover:bg-red-50 rounded"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setOptions([...options, 'New Option'])}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        + Add Option
                    </button>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
        </div>
    );
};
