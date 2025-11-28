import React, { useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useBlanks, getTextFromChildren, type BlankData, type BlankStatus } from './hooks/useBlanks';

interface InlineBlanksProps {
    children: React.ReactNode;
    mode?: 'type' | 'picker';
    options?: string[];
}

export const InlineBlanks: React.FC<InlineBlanksProps> = ({ children, mode = 'type', options = [] }) => {
    // Pre-process children: dedent if string to ensure markdown tables work
    const contentToProcess = useMemo(() => {
        // Convert children to string first (MDX may pass as array)
        const text = getTextFromChildren(children);

        if (text.includes('|') || text.includes('\n')) {
            const lines = text.split('\n');
            const minIndent = lines.reduce((min, line) => {
                if (line.trim().length === 0) return min;
                const indent = line.match(/^\s*/)?.[0].length || 0;
                return Math.min(min, indent);
            }, Infinity);

            if (minIndent !== Infinity && minIndent > 0) {
                return lines.map(line => line.length >= minIndent ? line.slice(minIndent) : line).join('\n');
            }
            return text;
        }
        return children;
    }, [children]);

    const {
        blanksData,
        inputs,
        handleInputChange,
        touched,
        revealAnswer,
        renderContent
    } = useBlanks({ children: contentToProcess, mode, options });

    const renderBlank = useCallback((index: number, data: BlankData, status: BlankStatus) => {
        const { value, isCorrect, isWrong } = status;
        const { answer, localOptions } = data;

        // Combine answer with options for the dropdown
        const currentOptions = localOptions.length > 0 ? localOptions : options;
        const dropdownOptions = Array.from(new Set([...currentOptions, answer])).sort();

        // Always show green if correct and not empty (InlineBlanks specific logic)
        const isRight = isCorrect && value.trim() !== '';

        return (
            <span key={index} className="inline-flex items-center relative mx-1 align-middle">
                {mode === 'picker' ? (
                    <select
                        key={`inline-blank-select-${index}`}
                        value={value}
                        onChange={(e) => {
                            handleInputChange(index, e.target.value);
                        }}
                        className={clsx(
                            "px-1 py-0.5 border-b-2 outline-none bg-transparent transition-colors text-center min-w-[60px] cursor-pointer appearance-none pr-4",
                            isRight ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20" :
                                isWrong ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20" :
                                    "border-gray-300 focus:border-blue-500 dark:border-gray-600"
                        )}
                    >
                        <option value="" disabled>...</option>
                        {dropdownOptions.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        key={`inline-blank-input-${index}`}
                        type="text"
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        value={value}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        className={clsx(
                            "px-1 py-0.5 border-b-2 outline-none bg-transparent transition-colors text-center min-w-[40px]",
                            isRight ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20" :
                                isWrong ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20" :
                                    "border-gray-300 focus:border-blue-500 dark:border-gray-600"
                        )}
                        style={{ width: `${Math.max(answer.length * 10 + 10, 40)}px` }}
                    />
                )}
                <button
                    onClick={() => revealAnswer(index)}
                    title={value === answer ? "Hide hint" : "Show hint"}
                    className="ml-0.5 p-0.5 text-gray-400 hover:text-yellow-500 transition-colors focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                    </svg>
                </button>
            </span>
        );
    }, [mode, inputs, handleInputChange, options, revealAnswer]);

    // Check if content is a markdown table (not just any text with pipes or newlines)
    const isMarkdown = useMemo(() => {
        if (typeof contentToProcess !== 'string') return false;
        const text = contentToProcess;
        const lines = text.split('\n');
        // A markdown table must have pipes AND a separator line (e.g., | --- | --- |)
        const hasPipes = lines.some(line => line.includes('|'));
        const hasSeparator = lines.some(line => /^\s*\|[\s\-:|]+\|\s*$/.test(line));
        return hasPipes && hasSeparator;
    }, [contentToProcess]);

    // Memoize processed markdown to prevent re-parsing
    const processedMarkdown = useMemo(() => {
        if (!isMarkdown) return '';
        const text = contentToProcess as string;
        const parts = text.split(/(\[.*?\])/g);
        let blankIndex = 0;
        return parts.map(part => {
            if (part.startsWith('[') && part.endsWith(']')) {
                const index = blankIndex++;
                return `<span data-blank="${index}"></span>`;
            }
            return part;
        }).join('');
    }, [isMarkdown, contentToProcess]);

    // Memoize components object to prevent ReactMarkdown re-creation
    const markdownComponents = useMemo(() => ({
        span: (props: any) => {
            const indexStr = props['data-blank'];
            if (indexStr !== undefined) {
                const index = parseInt(indexStr as string);
                const data = blanksData[index];
                if (!data) return null;

                const value = inputs[index] || '';
                const isCorrect = value.trim().toLowerCase() === data.answer.toLowerCase();
                const showValidation = touched[index] && value.trim() !== '';
                const status = {
                    value,
                    isCorrect,
                    isWrong: showValidation && !isCorrect,
                    touched: touched[index],
                    showValidation
                };
                return renderBlank(index, data, status);
            }
            return <span {...props} />;
        },
        p: ({ children }: any) => <span className="block mb-2">{children}</span>
    }), [blanksData, inputs, touched, renderBlank]);

    if (isMarkdown) {
        return (
            <span className="leading-normal">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                >
                    {processedMarkdown}
                </ReactMarkdown>
            </span>
        );
    }

    return (
        <span className="leading-normal">
            {renderContent(renderBlank)}
        </span>
    );
};
