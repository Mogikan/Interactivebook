import React, { useState, useEffect } from 'react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface MatchingWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

export const MatchingWizard: React.FC<MatchingWizardProps> = ({ component, onSave, onCancel }) => {
    const [pairs, setPairs] = useState<{ left: string, right: string }[]>([]);
    const [direction, setDirection] = useState('right');

    useEffect(() => {
        setPairs(Array.isArray(component.props.pairs) ? component.props.pairs : []);
        setDirection(component.props.direction || 'right');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        const newProps = {
            pairs,
            // Only save direction if it's not the default 'right'
            ...(direction !== 'right' ? { direction } : {})
        };

        onSave({
            ...component,
            props: newProps
        });
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Edit Matching</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pairs</label>
                {pairs.map((pair, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                        <div className="flex-1">
                            <input
                                placeholder="Left"
                                value={pair.left}
                                onChange={e => {
                                    const newPairs = [...pairs];
                                    newPairs[idx] = { ...pair, left: e.target.value };
                                    setPairs(newPairs);
                                }}
                                className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                            />
                        </div>
                        <span>↔</span>
                        <div className="flex-1">
                            <input
                                placeholder="Right"
                                value={pair.right}
                                onChange={e => {
                                    const newPairs = [...pairs];
                                    newPairs[idx] = { ...pair, right: e.target.value };
                                    setPairs(newPairs);
                                }}
                                className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                            />
                        </div>
                        <button
                            onClick={() => setPairs(pairs.filter((_, i) => i !== idx))}
                            className="px-2 text-red-500 hover:bg-red-50 rounded"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => setPairs([...pairs, { left: '', right: '' }])}
                    className="text-sm text-blue-600 hover:underline"
                >
                    + Add Pair
                </button>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Direction (Target Column)</label>
                <select
                    value={direction}
                    onChange={e => setDirection(e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                >
                    <option value="left">Left (Targets on Left)</option>
                    <option value="right">Right (Targets on Right)</option>
                </select>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
        </div>
    );
};
