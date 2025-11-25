import React, { useState, useEffect } from 'react';
import { MDXEditor } from '../components/editor/MDXEditor';
import { Upload, Copy, Save, Trash2 } from 'lucide-react';

export default function EditorPage() {
    const [mdxContent, setMdxContent] = useState<string>(() => {
        return localStorage.getItem('akkem_editor_content') || '';
    });

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setMdxContent(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    // Save to localStorage whenever content changes
    useEffect(() => {
        localStorage.setItem('akkem_editor_content', mdxContent);
    }, [mdxContent]);

    const handleSaveFile = async () => {
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: 'exercise.mdx',
                    types: [{
                        description: 'MDX File',
                        accept: { 'text/markdown': ['.mdx', '.md'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(mdxContent);
                await writable.close();
            } else {
                // Fallback for browsers that don't support File System Access API
                const blob = new Blob([mdxContent], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'exercise.mdx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to save file:', err);
            // Ignore abort errors (user cancelled)
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
            setMdxContent('');
            localStorage.removeItem('akkem_editor_content');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <h1 className="text-xl font-bold">Editor</h1>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer transition-colors font-medium shadow-sm border border-transparent">
                        <Upload size={16} />
                        <span>Open File</span>
                        <input
                            type="file"
                            accept=".mdx,.md"
                            onChange={handleFileLoad}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={handleSaveFile}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors font-medium shadow-sm"
                    >
                        <Save size={16} />
                        <span>Save As...</span>
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(mdxContent);
                            alert('Copied to clipboard!');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors font-medium shadow-sm"
                    >
                        <Copy size={16} />
                        <span>Copy MDX</span>
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 dark:bg-gray-800 dark:text-red-400 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-colors font-medium shadow-sm"
                    >
                        <Trash2 size={16} />
                        <span>Clear</span>
                    </button>
                </div>
            </div>

            <MDXEditor
                value={mdxContent}
                onChange={setMdxContent}
                className="flex-1 overflow-hidden"
            />
        </div>
    );
}
