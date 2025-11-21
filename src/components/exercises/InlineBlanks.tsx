import React, { useState } from 'react';
import { clsx } from 'clsx';

interface InlineBlanksProps {
    children: React.ReactNode;
    mode?: 'type' | 'picker';
    options?: string[];
}

// Helper to extract text from ReactNode (reused logic)
const getTextFromChildren = (children: React.ReactNode): string => {
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return children.toString();
    if (Array.isArray(children)) return children.map(getTextFromChildren).join('');
    if (React.isValidElement(children)) {
        const props = children.props as { children?: React.ReactNode };
        if (props.children) {
            return getTextFromChildren(props.children);
        }
    }
    return '';
};

export const InlineBlanks: React.FC<InlineBlanksProps> = ({ children, mode = 'type', options = [] }) => {
    const text = getTextFromChildren(children);
    // Parse text to find blanks: [answer] or [answer|opt1|opt2]
    const parts = text.split(/(\[.*?\])/g);

    // Extract answers and options for each blank
    const blanksData = parts
        .filter(p => p.startsWith('[') && p.endsWith(']'))
        .map(p => {
            const content = p.slice(1, -1); // Remove [ and ]
            const items = content.split('|');
            const answer = items[0];
            const localOptions = items.slice(1);
            return { answer, localOptions };
        });

    const answers = blanksData.map(b => b.answer);

    const [inputs, setInputs] = useState<string[]>(new Array(answers.length).fill(''));
    const [touched, setTouched] = useState<boolean[]>(new Array(answers.length).fill(false));

    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        setInputs(newInputs);
    };

    const handleBlur = (index: number) => {
        const newTouched = [...touched];
        newTouched[index] = true;
        setTouched(newTouched);
    };

    const revealAnswer = (index: number) => {
        const newInputs = [...inputs];
        const currentVal = newInputs[index];
        const answer = answers[index];

        if (currentVal === answer) {
            // Toggle off: clear input
            newInputs[index] = '';
        } else {
            // Toggle on: show answer
            newInputs[index] = answer;
        }
        setInputs(newInputs);

        // Mark as touched to show validation
        const newTouched = [...touched];
        newTouched[index] = true;
        setTouched(newTouched);
    };

    let blankIndex = 0;
    const content = parts.map((part, idx) => {
        if (part.startsWith('[') && part.endsWith(']')) {
            const { answer, localOptions } = blanksData[blankIndex];
            const currentIndex = blankIndex++;

            const val = inputs[currentIndex];
            const isCorrect = val.trim().toLowerCase() === answer.toLowerCase();
            // Show validation if touched and not empty, OR if it matches exactly (even if not touched, e.g. after hint)
            const showValidation = touched[currentIndex] && val.trim() !== '';
            const isWrong = showValidation && !isCorrect;
            const isRight = isCorrect && val.trim() !== ''; // Always show green if correct and not empty

            // Combine answer with options for the dropdown, ensuring answer is included
            // Use local options if present, otherwise global options (legacy support or mixed usage)
            const currentOptions = localOptions.length > 0 ? localOptions : options;
            const dropdownOptions = Array.from(new Set([...currentOptions, answer])).sort();

            return (
                <span key={idx} className="inline-flex items-center relative mx-1 align-middle">
                    {mode === 'picker' ? (
                        <select
                            value={inputs[currentIndex]}
                            onChange={(e) => {
                                handleInputChange(currentIndex, e.target.value);
                                handleBlur(currentIndex); // Mark as touched immediately on selection
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
                            type="text"
                            value={inputs[currentIndex]}
                            onChange={(e) => handleInputChange(currentIndex, e.target.value)}
                            onBlur={() => handleBlur(currentIndex)}
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
                        onClick={() => revealAnswer(currentIndex)}
                        title={val === answer ? "Скрыть подсказку" : "Показать подсказку"}
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
        }
        return <span key={idx}>{part}</span>;
    });

    return (
        <span className="leading-normal">
            {content}
        </span>
    );
};
