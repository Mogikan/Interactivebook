import React from 'react';

interface MediaProps {
    src: string;
    type: 'audio' | 'video' | 'youtube';
    caption?: string;
}

export const Media: React.FC<MediaProps> = ({ src, type, caption }) => {
    const renderMedia = () => {
        switch (type) {
            case 'youtube':
                // Extract video ID if full URL is provided, or use as is if it's just ID
                const videoId = src.includes('v=') ? src.split('v=')[1].split('&')[0] : src;
                return (
                    <div className="aspect-w-16 aspect-h-9 w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-lg">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full min-h-[400px]"
                        ></iframe>
                    </div>
                );
            case 'video':
                return (
                    <video controls className="w-full max-w-3xl mx-auto rounded-xl shadow-lg">
                        <source src={src} />
                        Your browser does not support the video tag.
                    </video>
                );
            case 'audio':
                return (
                    <div className="w-full max-w-xl mx-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm">
                        <audio controls className="w-full">
                            <source src={src} />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="my-8">
            {renderMedia()}
            {caption && (
                <p className="text-center text-sm text-gray-500 mt-2 dark:text-gray-400">
                    {caption}
                </p>
            )}
        </div>
    );
};
