import React, { useState, useEffect } from 'react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface GroupingWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

interface Group {
    name: string;
    items: string[];
}

export const GroupingWizard: React.FC<GroupingWizardProps> = ({ component, onSave, onCancel }) => {
    const [groups, setGroups] = useState<Group[]>([]);

    useEffect(() => {
        const initialGroups = component.props.groups || {};
        const parsedGroups: Group[] = Object.entries(initialGroups).map(([name, items]) => ({
            name,
            items: Array.isArray(items) ? (items as string[]) : []
        }));

        if (parsedGroups.length === 0) {
            setGroups([{ name: 'Group 1', items: [] }, { name: 'Group 2', items: [] }]);
        } else {
            setGroups(parsedGroups);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        const groupsObj: Record<string, string[]> = {};
        groups.forEach(g => {
            if (g.name.trim()) {
                groupsObj[g.name.trim()] = g.items.filter(i => i.trim() !== '');
            }
        });

        onSave({
            ...component,
            props: {
                groups: groupsObj
            }
        });
    };

    const updateGroupName = (index: number, name: string) => {
        const newGroups = [...groups];
        newGroups[index].name = name;
        setGroups(newGroups);
    };

    const addItemToGroup = (groupIndex: number) => {
        const newGroups = [...groups];
        newGroups[groupIndex].items.push('');
        setGroups(newGroups);
    };

    const updateItem = (groupIndex: number, itemIndex: number, value: string) => {
        const newGroups = [...groups];
        newGroups[groupIndex].items[itemIndex] = value;
        setGroups(newGroups);
    };

    const removeItem = (groupIndex: number, itemIndex: number) => {
        const newGroups = [...groups];
        newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
        setGroups(newGroups);
    };

    const removeGroup = (index: number) => {
        setGroups(groups.filter((_, i) => i !== index));
    };

    const addGroup = () => {
        setGroups([...groups, { name: `Group ${groups.length + 1}`, items: [] }]);
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Grouping</h3>

            <div className="space-y-6 mb-6">
                {groups.map((group, groupIdx) => (
                    <div key={groupIdx} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                        <div className="flex gap-2 mb-3 items-center">
                            <input
                                value={group.name}
                                onChange={e => updateGroupName(groupIdx, e.target.value)}
                                placeholder="Group Name"
                                className="flex-1 p-2 font-bold border rounded dark:bg-gray-800 dark:border-gray-600"
                            />
                            <button
                                onClick={() => removeGroup(groupIdx)}
                                className="text-red-500 hover:bg-red-100 p-2 rounded"
                                title="Remove Group"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {group.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex gap-2">
                                    <input
                                        value={item}
                                        onChange={e => updateItem(groupIdx, itemIdx, e.target.value)}
                                        placeholder="Item text"
                                        className="flex-1 p-1.5 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                                    />
                                    <button
                                        onClick={() => removeItem(groupIdx, itemIdx)}
                                        className="text-gray-400 hover:text-red-500 px-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addItemToGroup(groupIdx)}
                                className="text-sm text-blue-600 hover:underline mt-2"
                            >
                                + Add Item
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-6">
                <button
                    onClick={addGroup}
                    className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-blue-500 hover:text-blue-500 rounded-lg transition-colors"
                >
                    + Add New Group
                </button>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
        </div>
    );
};
