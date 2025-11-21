import React, { useState, useEffect } from 'react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface OrderingWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

export const OrderingWizard: React.FC<OrderingWizardProps> = ({ component, onSave, onCancel }) => {
    const [items, setItems] = useState<string[]>([]);
    const [direction, setDirection] = useState('vertical');
    const [mode, setMode] = useState('list');

    useEffect(() => {
        setItems(component.props.items || []);
        setDirection(component.props.direction || 'vertical');
        setMode(component.props.mode || 'list');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        const newProps = {
            items,
            ...(direction !== 'vertical' ? { direction } : {}),
            ...(mode !== 'list' ? { mode } : {})
        };

        onSave({
            ...component,
            props: newProps
        });
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Edit Ordering</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Items (Correct Order)</label>
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                        <span className="py-2 text-gray-400 w-6 text-center">{idx + 1}</span>
                        <input
                            value={item}
                            onChange={e => {
                                const newItems = [...items];
                                newItems[idx] = e.target.value;
                                setItems(newItems);
                            }}
                            className="flex-1 p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                        />
                        <button
                            onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            className="px-2 text-red-500 hover:bg-red-50 rounded"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => setItems([...items, 'New Item'])}
                    className="text-sm text-blue-600 hover:underline"
                >
                    + Add Item
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
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
                <div>
                    <label className="block text-sm font-medium mb-1">Mode</label>
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                    >
                        <option value="list">List (Drag)</option>
                        <option value="compact">Compact (Click/Sentence)</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
        </div>
    );
};
