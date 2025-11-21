import React, { useState, useEffect } from 'react';
import type { ExerciseComponent } from '../../../utils/mdxParser';

interface MediaWizardProps {
    component: ExerciseComponent;
    onSave: (newComponent: ExerciseComponent) => void;
    onCancel: () => void;
}

export const MediaWizard: React.FC<MediaWizardProps> = ({ component, onSave, onCancel }) => {
    const [src, setSrc] = useState('');
    const [type, setType] = useState<'audio' | 'video' | 'youtube'>('youtube');
    const [caption, setCaption] = useState('');

    useEffect(() => {
        setSrc(component.props.src || '');
        setType(component.props.type || 'youtube');
        setCaption(component.props.caption || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        onSave({
            ...component,
            props: {
                src,
                type,
                ...(caption ? { caption } : {})
            }
        });
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Edit Media</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Media Type</label>
                <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                >
                    <option value="youtube">YouTube</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Source URL</label>
                <input
                    value={src}
                    onChange={e => setSrc(e.target.value)}
                    placeholder={type === 'youtube' ? 'https://youtube.com/watch?v=...' : '/assets/audio/file.mp3'}
                    className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                />
                {type === 'youtube' && (
                    <p className="text-xs text-gray-500 mt-1">You can paste the full URL or just the video ID.</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Caption (Optional)</label>
                <input
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Description of the media"
                    className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                />
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
        </div>
    );
};
