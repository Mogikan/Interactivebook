import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { clsx } from 'clsx';

interface GroupingProps {
    groups: { [groupName: string]: string[] };
}

// Draggable Item
function DraggableItem({ id, text, className, disabled }: { id: string; text: string; className?: string; disabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, disabled });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={clsx(
                "inline-block px-3 py-1.5 m-1 border rounded-full shadow-sm cursor-grab active:cursor-grabbing",
                className || "bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600",
                disabled && "cursor-default"
            )}
        >
            {text}
        </div>
    );
}

// Group Container
function GroupContainer({ id, title, items, isOver, submitted, correctItems }: { id: string; title: string; items: { id: string; text: string }[]; isOver: boolean; submitted: boolean; correctItems: string[] }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "flex-1 min-w-[200px] p-4 rounded-xl border-2 transition-colors min-h-[200px]",
                isOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
            )}
        >
            <h3 className="font-bold mb-4 text-center text-gray-700 dark:text-gray-300">{title}</h3>
            <div className="flex flex-wrap gap-2 content-start">
                {items.map(item => {
                    const isCorrect = submitted && correctItems.includes(item.text);
                    const isWrong = submitted && !isCorrect;

                    return (
                        <DraggableItem
                            key={item.id}
                            id={item.id}
                            text={item.text}
                            disabled={submitted}
                            className={clsx(
                                isCorrect ? "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200" :
                                    isWrong ? "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200" :
                                        "bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export const Grouping: React.FC<GroupingProps> = ({ groups }) => {
    const [items, setItems] = useState<{ id: string; text: string }[]>([]);
    const [placements, setPlacements] = useState<{ [itemId: string]: string }>({}); // itemId -> groupId
    const [submitted, setSubmitted] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);

    useEffect(() => {
        const allItems: { id: string; text: string }[] = [];
        Object.values(groups).flat().forEach((text, i) => {
            allItems.push({ id: `item-${i}-${text}`, text });
        });
        setItems(allItems.sort(() => Math.random() - 0.5));
    }, [groups]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over) {
            setPlacements(prev => ({
                ...prev,
                [active.id as string]: over.id as string
            }));
        } else {
            // If dropped outside, remove from group (return to bank)
            setPlacements(prev => {
                const next = { ...prev };
                delete next[active.id as string];
                return next;
            });
        }
    };

    const checkAnswers = () => {
        setSubmitted(true);
        setShowAnswers(false);
    };

    const reset = () => {
        setSubmitted(false);
        setShowAnswers(false);
        setPlacements({});
        setItems(prev => [...prev].sort(() => Math.random() - 0.5));
    };

    const handleShowAnswers = () => {
        setShowAnswers(true);
        setSubmitted(true);

        const newPlacements: { [itemId: string]: string } = {};
        items.forEach(item => {
            // Find which group this item belongs to
            const groupName = Object.keys(groups).find(g => groups[g].includes(item.text));
            if (groupName) {
                newPlacements[item.id] = groupName;
            }
        });
        setPlacements(newPlacements);
    };

    const unplacedItems = items.filter(item => !placements[item.id]);

    const isAllCorrect = items.every(item => {
        const groupId = placements[item.id];
        if (!groupId) return false;
        return groups[groupId].includes(item.text);
    });

    return (
        <div className="my-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <DndContext onDragEnd={handleDragEnd}>

                {/* Bank of items */}
                {!submitted && !showAnswers && (
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[60px] flex flex-wrap gap-2">
                        {unplacedItems.length === 0 ? (
                            <span className="text-gray-400 italic w-full text-center">All items placed</span>
                        ) : (
                            unplacedItems.map(item => (
                                <DraggableItem key={item.id} id={item.id} text={item.text} />
                            ))
                        )}
                    </div>
                )}

                {/* Groups */}
                <div className="flex flex-wrap gap-4">
                    {Object.keys(groups).map(groupName => {
                        const groupItems = items.filter(item => placements[item.id] === groupName);
                        return (
                            <GroupContainer
                                key={groupName}
                                id={groupName}
                                title={groupName}
                                items={groupItems}
                                isOver={false} // We could track this with useDroppable but it's inside the component
                                submitted={submitted}
                                correctItems={groups[groupName]}
                            />
                        );
                    })}
                </div>

            </DndContext>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
                {!submitted ? (
                    <>
                        <button
                            onClick={checkAnswers}
                            disabled={unplacedItems.length > 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Check
                        </button>
                        <button
                            onClick={handleShowAnswers}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                            Show answers
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white transition-colors"
                        >
                            Try again
                        </button>
                        {!showAnswers && (
                            <button
                                onClick={handleShowAnswers}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                                Show answers
                            </button>
                        )}
                        <span className={clsx(
                            "font-medium ml-auto",
                            isAllCorrect ? "text-green-600" : "text-red-600"
                        )}>
                            {isAllCorrect ? "Correct! 🎉" : "There are errors"}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
