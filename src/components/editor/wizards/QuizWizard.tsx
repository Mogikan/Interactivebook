import React, { useState, useEffect } from 'react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface QuizWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

export const QuizWizard: React.FC<QuizWizardProps> = ({ component, onSave, onCancel }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [answer, setAnswer] = useState('');
    const [multiple, setMultiple] = useState(false);
    const [direction, setDirection] = useState('vertical');

    useEffect(() => {
        // Parse children to extract question and options
        // Format: Question text... <Option>Opt1</Option> <Option>Opt2</Option>
        const children = component.children || '';

        // Extract options
        const optionRegex = /<Option>(.*?)<\/Option>/g;
        const extractedOptions: string[] = [];
        let match;
        while ((match = optionRegex.exec(children)) !== null) {
            extractedOptions.push(match[1]);
        }
        setOptions(extractedOptions);

        // Extract question (everything before the first Option)
        const firstOptionIndex = children.indexOf('<Option>');
        if (firstOptionIndex !== -1) {
            setQuestion(children.substring(0, firstOptionIndex).trim());
        } else {
            setQuestion(children.trim());
        }

        setAnswer(component.props.answer || '1');
        setMultiple(component.props.multiple || false);
        setDirection(component.props.direction || 'vertical');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        // Reconstruct children
        const optionsStr = options.map(opt => `  <Option>${opt}</Option>`).join('\n');
        const newChildren = `${question}\n${optionsStr}`;

        const newProps = {
            answer,
            ...(multiple ? { multiple: true } : {}),
            ...(direction !== 'vertical' ? { direction } : {})
        };

        onSave({
            ...component,
            props: newProps,
            children: newChildren
        });
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Edit Quiz</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                    rows={3}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Options</label>
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

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Correct Answer(s)</label>
                    <input
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="e.g. 1 or 1,3"
                        className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">1-based index</p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Direction</label>
                    <select
                        value={direction}
                        onChange={e => setDirection(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                    >
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={multiple}
                        onChange={e => setMultiple(e.target.checked)}
                    />
                    <span className="text-sm">Multiple Correct Answers</span>
                </label>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
        </div>
    );
};
