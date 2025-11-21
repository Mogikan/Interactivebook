import React, { useState } from 'react';

interface TableWizardProps {
    onSave: (markdown: string) => void;
    onCancel: () => void;
}

export const TableWizard: React.FC<TableWizardProps> = ({ onSave, onCancel }) => {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);

    const handleSave = () => {
        // Generate Markdown Table
        // Header row
        let markdown = '|';
        for (let c = 0; c < cols; c++) {
            markdown += ` Header ${c + 1} |`;
        }
        markdown += '\n|';

        // Separator row
        for (let c = 0; c < cols; c++) {
            markdown += ' --- |';
        }
        markdown += '\n';

        // Body rows
        for (let r = 0; r < rows; r++) {
            markdown += '|';
            for (let c = 0; c < cols; c++) {
                markdown += ` Cell ${r + 1}-${c + 1} |`;
            }
            markdown += '\n';
        }

        onSave(markdown);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Insert Table</h3>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Columns</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={cols}
                            onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rows</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={rows}
                            onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Insert Table
                    </button>
                </div>
            </div>
        </div>
    );
};
