import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { useSettings } from '../../context/SettingsContext';

interface FillBlanksProps {
    children: React.ReactNode; // Text with {answer} or [answer]
    mode?: 'input' | 'drag' | 'picker';
    options?: string[]; // For drag mode, distractors can be added here
}

// Helper to extract text from ReactNode
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

// Draggable Item
function DraggableWord({ id, text, disabled, className }: { id: string; text: string; disabled?: boolean; className?: string }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, disabled });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    return (
        <span
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={clsx(
                "inline-block px-2 py-1 m-1 border rounded cursor-grab active:cursor-grabbing",
                disabled ? "cursor-default bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600" : "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700",
                className
            )}
        >
            {text}
        </span>
    );
}

// Drop Zone
// DropZone needs to render the DraggableWord if it has one.
// Since we only pass the ID to DropZone, we need to pass the text too or let it look it up.
// The previous replacement passed `current` (which is ID) to DropZone. 
// But DropZone doesn't know the text.
// We need to update DropZone signature or how it's called.
// In the previous step, I updated FillBlanks to call DropZone with `current={currentId}`.
// But DropZone definition was NOT updated in the previous step to accept a `text` prop or similar.
// Wait, I replaced the WHOLE FillBlanks component including DropZone in the previous step?
// No, I replaced from line 69. DropZone is defined before line 69.
// I need to update DropZone definition as well.

function DropZone({ id, current, text, disabled }: { id: string; current?: string; text?: string; disabled?: boolean }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <span
            ref={setNodeRef}
            className={clsx(
                "inline-block min-w-[80px] min-h-[30px] mx-1 border-b-2 transition-colors align-bottom text-center",
                isOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600",
                current ? "" : "text-gray-400"
            )}
        >
            {current && text ? (
                <DraggableWord id={current} text={text} disabled={disabled} />
            ) : "?"}
        </span>
    );
}


export const FillBlanks: React.FC<FillBlanksProps> = ({ children, mode = 'input', options = [] }) => {
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
    const [submitted, setSubmitted] = useState(false);
    const [touched, setTouched] = useState<boolean[]>(new Array(answers.length).fill(false));
    const [showAnswers, setShowAnswers] = useState(false);
    const { showHints } = useSettings();

    // Generate unique IDs for all items (answers + options)
    const [allItems] = useState<{ id: string; text: string }[]>(() => {
        const getFreq = (arr: string[]) => {
            const map = new Map<string, number>();
            arr.forEach(t => map.set(t, (map.get(t) || 0) + 1));
            return map;
        };

        const ansFreq = getFreq(answers);
        const optFreq = getFreq(options);
        const allKeys = new Set([...ansFreq.keys(), ...optFreq.keys()]);

        const merged: string[] = [];
        allKeys.forEach(key => {
            const count = Math.max(ansFreq.get(key) || 0, optFreq.get(key) || 0);
            for (let i = 0; i < count; i++) merged.push(key);
        });

        return merged.map((t, i) => ({ id: `item-${i}-${Math.random().toString(36).substr(2, 9)}`, text: t }));
    });

    // dragItems stores IDs of items currently in the bank
    const [dragItems, setDragItems] = useState<string[]>(() =>
        allItems.map(i => i.id).sort(() => Math.random() - 0.5)
    );

    // droppedItems maps dropZoneId -> itemId
    const [droppedItems, setDroppedItems] = useState<{ [key: string]: string }>({});

    // Selection state for click interaction
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeDropMenu, setActiveDropMenu] = useState<string | null>(null); // dropZoneId

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeId = active.id as string;

        // Determine if the active item came from the bank or a drop zone
        const sourceDropZoneId = Object.keys(droppedItems).find(key => droppedItems[key] === activeId);
        const isFromBank = dragItems.includes(activeId);

        if (over) {
            const targetDropZoneId = over.id as string;

            // If dropping on same zone, do nothing
            if (sourceDropZoneId === targetDropZoneId) return;

            // Get the item currently in the target drop zone, if any
            const itemInTargetZone = droppedItems[targetDropZoneId];

            setDroppedItems(prevDropped => {
                const newDropped = { ...prevDropped };

                // 1. Place the active item into the target drop zone
                newDropped[targetDropZoneId] = activeId;

                // 2. If the active item came from another drop zone, clear its original spot
                if (sourceDropZoneId) {
                    delete newDropped[sourceDropZoneId];
                }

                return newDropped;
            });

            setDragItems(prevDragItems => {
                let newDragItems = [...prevDragItems];

                // 1. If the active item came from the bank, remove it from the bank
                if (isFromBank) {
                    newDragItems = newDragItems.filter(item => item !== activeId);
                }

                // 2. If the target drop zone had an item, return it to the bank
                if (itemInTargetZone) {
                    newDragItems.push(itemInTargetZone);
                }

                return newDragItems;
            });

        } else {
            // Dropped outside (back to bank)
            if (sourceDropZoneId) { // Only if it came from a drop zone
                setDroppedItems(prevDropped => {
                    const newDropped = { ...prevDropped };
                    delete newDropped[sourceDropZoneId]; // Remove from its drop zone
                    return newDropped;
                });
                setDragItems(prevDragItems => [...prevDragItems, activeId]); // Add back to bank
            }
        }
        setSelectedId(null);
    };

    const handleWordClick = (id: string) => {
        if (submitted) return;
        setSelectedId(prev => prev === id ? null : id);
        setActiveDropMenu(null);
    };

    const handleDropZoneClick = (dropId: string) => {
        if (submitted) return;

        const currentItemId = droppedItems[dropId];

        // Case 1: Word selected -> Fill blank
        if (selectedId) {
            // If same word, do nothing
            if (currentItemId === selectedId) {
                setSelectedId(null);
                return;
            }

            // Move word to this drop zone
            const sourceDropZoneId = Object.keys(droppedItems).find(key => droppedItems[key] === selectedId);
            const isFromBank = dragItems.includes(selectedId);

            setDroppedItems(prev => {
                const next = { ...prev };
                next[dropId] = selectedId;
                if (sourceDropZoneId) delete next[sourceDropZoneId];
                return next;
            });

            setDragItems(prev => {
                let next = [...prev];
                if (isFromBank) next = next.filter(id => id !== selectedId);
                if (currentItemId) next.push(currentItemId); // Return current item to bank
                return next;
            });

            setSelectedId(null);
            return;
        }

        // Case 2: Blank filled -> Return to bank
        if (currentItemId) {
            setDroppedItems(prev => {
                const next = { ...prev };
                delete next[dropId];
                return next;
            });
            setDragItems(prev => [...prev, currentItemId]);
            return;
        }

        // Case 3: Blank empty -> Show menu
        setActiveDropMenu(prev => prev === dropId ? null : dropId);
    };

    const handleMenuOptionClick = (dropId: string, itemId: string) => {
        setDroppedItems(prev => ({ ...prev, [dropId]: itemId }));
        setDragItems(prev => prev.filter(id => id !== itemId));
        setActiveDropMenu(null);
    };

    const checkAnswers = () => {
        setSubmitted(true);
        setShowAnswers(false);
        setSelectedId(null);
        setActiveDropMenu(null);
    };

    const retry = () => {
        setSubmitted(false);
        setShowAnswers(false);
        setActiveDropMenu(null);
        // Do NOT clear inputs
    };

    const reset = () => {
        setSubmitted(false);
        setShowAnswers(false);
        setInputs(new Array(answers.length).fill(''));
        setTouched(new Array(answers.length).fill(false));
        setDroppedItems({});
        setSelectedId(null);
        setActiveDropMenu(null);

        // Re-generate items to ensure fresh state if needed, or just reshuffle
        // Actually, we should keep the same items
        setDragItems(allItems.map(i => i.id).sort(() => Math.random() - 0.5));
    };

    const handleShowAnswers = () => {
        setShowAnswers(true);
        setSubmitted(true);
        setSelectedId(null);
        setActiveDropMenu(null);

        if (mode === 'input' || mode === 'picker') {
            setInputs([...answers]);
        } else {
            // For drag mode: fill drops with correct items
            // We need to find *an* item with the correct text for each slot
            // This is tricky with unique IDs. We need to allocate available items to slots.

            const newDropped: { [key: string]: string } = {};
            const usedItemIds = new Set<string>();

            answers.forEach((ans, idx) => {
                // Find an item with this text that hasn't been used yet
                const item = allItems.find(i => i.text === ans && !usedItemIds.has(i.id));
                if (item) {
                    newDropped[`drop-${idx}`] = item.id;
                    usedItemIds.add(item.id);
                }
            });

            setDroppedItems(newDropped);
            setDragItems(allItems.filter(i => !usedItemIds.has(i.id)).map(i => i.id));
        }
    };

    // Helper to look up text
    const getItemText = (id: string) => allItems.find(i => i.id === id)?.text || '';

    const allCorrect = (mode === 'input' || mode === 'picker')
        ? inputs.every((val, idx) => val.trim().toLowerCase() === answers[idx].toLowerCase())
        : answers.every((ans, idx) => {
            const droppedId = droppedItems[`drop-${idx}`];
            return droppedId && getItemText(droppedId) === ans;
        });

    // Recursive renderer to preserve structure (tables, lists, etc.)
    // while replacing text nodes with blanks.
    let blankIndexCounter = 0;

    const renderChildren = (nodes: React.ReactNode): React.ReactNode => {
        return React.Children.map(nodes, (child) => {
            if (typeof child === 'string') {
                // Split by blanks: [answer]
                const parts = child.split(/(\[.*?\])/g);
                return parts.map((part, i) => {
                    if (part.startsWith('[') && part.endsWith(']')) {
                        const { answer, localOptions } = blanksData[blankIndexCounter];
                        const currentIndex = blankIndexCounter++;

                        // Render Input, DropZone, or Picker
                        if (mode === 'input') {
                            const isCorrect = submitted && inputs[currentIndex].trim().toLowerCase() === answer.toLowerCase();
                            const isWrong = submitted && !isCorrect;

                            return (
                                <span key={`${currentIndex}-${i}`} className="inline-block mx-1">
                                    <input
                                        type="text"
                                        autoCapitalize="off"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        value={inputs[currentIndex]}
                                        onChange={(e) => {
                                            const newInputs = [...inputs];
                                            newInputs[currentIndex] = e.target.value;
                                            setInputs(newInputs);

                                            const newTouched = [...touched];
                                            newTouched[currentIndex] = true;
                                            setTouched(newTouched);
                                        }}
                                        disabled={submitted}
                                        className={clsx(
                                            "border-b-2 outline-none px-1 transition-colors bg-transparent min-w-[60px] text-center",
                                            isCorrect ? "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-t" :
                                                isWrong ? "border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-t" :
                                                    "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                                        )}
                                        style={{ width: `${Math.max(answer.length, 4)}ch` }}
                                    />
                                </span>
                            );
                        } else if (mode === 'picker') {
                            const isCorrect = submitted && inputs[currentIndex].trim().toLowerCase() === answer.toLowerCase();
                            const isWrong = submitted && !isCorrect;
                            // Combine answer with options for the dropdown
                            // Use local options if present, otherwise global options
                            const currentOptions = localOptions.length > 0 ? localOptions : options;
                            const dropdownOptions = Array.from(new Set([...currentOptions, answer])).sort();

                            return (
                                <span key={`${currentIndex}-${i}`} className="inline-block mx-1">
                                    <select
                                        value={inputs[currentIndex]}
                                        onChange={(e) => {
                                            const newInputs = [...inputs];
                                            newInputs[currentIndex] = e.target.value;
                                            setInputs(newInputs);

                                            const newTouched = [...touched];
                                            newTouched[currentIndex] = true;
                                            setTouched(newTouched);
                                        }}
                                        disabled={submitted}
                                        className={clsx(
                                            "border-b-2 outline-none px-1 transition-colors bg-transparent min-w-[60px] text-center cursor-pointer appearance-none pr-4",
                                            isCorrect ? "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-t" :
                                                isWrong ? "border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-t" :
                                                    "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                                        )}
                                    >
                                        <option value="" disabled>...</option>
                                        {dropdownOptions.map((opt, idx) => (
                                            <option key={idx} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </span>
                            );
                        } else {
                            // Drag mode
                            const dropId = `drop-${currentIndex}`;
                            const droppedItemId = droppedItems[dropId];
                            const droppedText = getItemText(droppedItemId || '');

                            const isCorrect = submitted && droppedText === answer;
                            const isWrong = submitted && droppedItemId && !isCorrect;

                            return (
                                <span key={`${currentIndex}-${i}`} className={clsx(
                                    "inline-block mx-1 rounded px-1 relative",
                                    isCorrect && "bg-green-100 dark:bg-green-900/30",
                                    isWrong && "bg-red-100 dark:bg-red-900/30"
                                )}>
                                    <span onClick={() => handleDropZoneClick(dropId)} className="inline-block cursor-pointer">
                                        <DropZone
                                            id={dropId}
                                            current={droppedItemId}
                                            text={droppedText}
                                            disabled={submitted}
                                        />
                                    </span>
                                    {/* Options Menu */}
                                    {activeDropMenu === dropId && !submitted && (
                                        <span className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[150px] max-h-[200px] overflow-y-auto block text-left">
                                            <span className="text-xs font-semibold text-gray-500 mb-2 px-2 block">Select word:</span>
                                            {dragItems.map(itemId => (
                                                <button
                                                    key={itemId}
                                                    onClick={() => handleMenuOptionClick(dropId, itemId)}
                                                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 block"
                                                >
                                                    {getItemText(itemId)}
                                                </button>
                                            ))}
                                            {dragItems.length === 0 && (
                                                <span className="text-xs text-gray-400 px-2 italic block">No words available</span>
                                            )}
                                        </span>
                                    )}
                                </span>
                            );
                        }
                    }
                    return part;
                });
            }

            if (React.isValidElement(child)) {
                // Recurse into children
                const props = child.props as { children?: React.ReactNode };
                if (props.children) {
                    return React.cloneElement(child, {
                        ...props,
                        children: renderChildren(props.children)
                    } as any);
                }
                return child;
            }

            return child;
        });
    };

    return (
        <div className="my-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="mb-6 leading-loose text-lg text-gray-800 dark:text-gray-200">
                    {/* Render children recursively */}
                    {renderChildren(children)}
                </div>

                {mode === 'drag' && !submitted && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Options:</div>
                        <div className="flex flex-wrap gap-2">
                            {dragItems.map(id => (
                                <span key={id} onClick={() => handleWordClick(id)} className="inline-block">
                                    <DraggableWord
                                        id={id}
                                        text={getItemText(id)}
                                        className={selectedId === id ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900" : ""}
                                    />
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </DndContext>

            <div className="flex gap-4 items-center flex-wrap">
                {!submitted ? (
                    <>
                        <button
                            onClick={checkAnswers}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm border border-transparent"
                        >
                            Check
                        </button>
                        {showHints && (
                            <button
                                onClick={handleShowAnswers}
                                className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors font-medium"
                            >
                                Show answers
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <button
                            onClick={retry}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white transition-colors"
                        >
                            Fix
                        </button>
                        <button
                            onClick={reset}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                            Reset
                        </button>
                        <span className={clsx(
                            "font-medium ml-auto",
                            allCorrect ? "text-green-600" : "text-red-600"
                        )}>
                            {allCorrect ? "Correct! 🎉" : "There are errors"}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
