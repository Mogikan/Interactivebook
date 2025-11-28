import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import remarkGithubBlockquoteAlert from 'remark-github-blockquote-alert';
import { Quiz, Option } from '../exercises/Quiz';
import { Ordering } from '../exercises/Ordering';
import { Matching } from '../exercises/Matching';
import { FillBlanks } from '../exercises/FillBlanks';
import { InlineBlanks } from '../exercises/InlineBlanks';
import { Grouping } from '../exercises/Grouping';
import { Media } from '../exercises/Media';
import { InteractiveMedia, Checkpoint } from '../exercises/InteractiveMedia';
import { Dialogue, Message } from '../exercises/Dialogue';
import { QuizWizard } from './wizards/QuizWizard';
import { OrderingWizard } from './wizards/OrderingWizard';
import { MatchingWizard } from './wizards/MatchingWizard';
import { FillBlanksWizard } from './wizards/FillBlanksWizard';
import { GroupingWizard } from './wizards/GroupingWizard';
import { MediaWizard } from './wizards/MediaWizard';
import { InteractiveMediaWizard } from './wizards/InteractiveMediaWizard';
import { generateComponentCode, parseExercises, type ExerciseComponent } from '../../utils/mdxParser';
import { EditableComponent } from './EditableComponent';
import { Toolbar } from './Toolbar';
import { InlineBlanksWizard } from './wizards/InlineBlanksWizard';
import { TableWizard } from './wizards/TableWizard';
import { DialogueWizard } from './wizards/DialogueWizard';
import { ErrorBoundary } from '../ErrorBoundary';
import { FileQuestion, ListOrdered, ArrowLeftRight, FormInput, Type, Layers, Image, MessageSquare, Film, Eye, EyeOff } from 'lucide-react';

interface MDXEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const MDXEditor: React.FC<MDXEditorProps> = ({ value, onChange, className }) => {
    const [activeWizard, setActiveWizard] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [MDXComponent, setMDXComponent] = useState<React.ComponentType<any> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);

    // Sync gutter scroll with textarea scroll
    const handleTextareaScroll = () => {
        if (textareaRef.current && gutterRef.current) {
            gutterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const insertTextAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = value.substring(0, start);
        const after = value.substring(end);

        const newContent = before + text + after;
        onChange(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 100);
    };

    const handleWrap = (prefix: string, suffix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selection = value.substring(start, end);
        const before = value.substring(0, start);
        const after = value.substring(end);

        const newContent = before + prefix + selection + suffix + after;
        onChange(newContent);

        setTimeout(() => {
            textarea.focus();
            // Select the wrapped text
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 100);
    };

    const handleBlock = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Find start of line
        const beforeSelection = value.substring(0, start);
        const lastNewLine = beforeSelection.lastIndexOf('\n');
        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;

        const beforeLine = value.substring(0, lineStart);
        const lineContent = value.substring(lineStart, end); // Includes selection
        const after = value.substring(end);

        const newContent = beforeLine + prefix + lineContent + after;
        onChange(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 100);
    };

    const replaceComponentAtIndex = (component: ExerciseComponent, index: number) => {
        // We need to re-parse to get fresh indices because manual edits might have shifted things
        const exercises = parseExercises(value);
        const target = exercises[index];

        if (!target) {
            console.error('Target component not found at index', index);
            return;
        }

        const newCode = generateComponentCode(component);
        const before = value.substring(0, target.startIndex);
        const after = value.substring(target.endIndex);

        onChange(before + newCode + after);
    };

    const handleWizardSave = (component: ExerciseComponent) => {
        if (editingIndex !== null) {
            // Updating existing
            replaceComponentAtIndex(component, editingIndex);
        } else {
            // Inserting new
            const code = generateComponentCode(component);
            insertTextAtCursor(code);
        }
        setActiveWizard(null);
        setEditingIndex(null);
    };

    const handleEditClick = (type: string, _props: any, index: number) => {
        // Find the component in the parsed list
        // The index passed here is the render index (0th component, 1st component...)
        // This should match the index in parseExercises() IF parseExercises returns them in order
        // parseExercises sorts by startIndex, so it should match.

        const exercises = parseExercises(value);
        const component = exercises[index];

        if (component) {
            setEditingIndex(index);
            setActiveWizard(type);
        } else {
            console.error('Could not match rendered component to source');
        }
    };

    const renderWizard = () => {
        if (!activeWizard) return null;

        let initialComponent: ExerciseComponent;

        if (editingIndex !== null) {
            const exercises = parseExercises(value);
            initialComponent = exercises[editingIndex];
        } else {
            initialComponent = { type: activeWizard, props: {}, raw: '', startIndex: 0, endIndex: 0 } as any;
        }

        const commonProps = {
            component: initialComponent,
            onSave: handleWizardSave,
            onCancel: () => {
                setActiveWizard(null);
                setEditingIndex(null);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                <div className="max-w-2xl w-full m-4">
                    {activeWizard === 'Quiz' && <QuizWizard {...commonProps} />}
                    {activeWizard === 'Ordering' && <OrderingWizard {...commonProps} />}
                    {activeWizard === 'Matching' && <MatchingWizard {...commonProps} />}
                    {activeWizard === 'InlineBlanks' && (
                        <InlineBlanksWizard
                            component={initialComponent}
                            onSave={handleWizardSave}
                            onCancel={() => {
                                setActiveWizard(null);
                                setEditingIndex(null);
                            }}
                        />
                    )}
                    {activeWizard === 'FillBlanks' && <FillBlanksWizard {...commonProps} />}
                    {activeWizard === 'Grouping' && <GroupingWizard {...commonProps} />}
                    {activeWizard === 'Dialogue' && <DialogueWizard {...commonProps} />}

                    {activeWizard === 'Media' && <MediaWizard {...commonProps} />}
                    {activeWizard === 'InteractiveMedia' && <InteractiveMediaWizard {...commonProps} />}
                    {activeWizard === 'Table' && (
                        <TableWizard
                            onSave={(markdown) => {
                                insertTextAtCursor(markdown);
                                setActiveWizard(null);
                            }}
                            onCancel={() => setActiveWizard(null)}
                        />
                    )}
                </div>
            </div>
        );
    };

    // Compile MDX whenever content changes
    useEffect(() => {
        const compileMdx = async () => {
            try {
                // Preprocess: Remove empty lines within exercise blocks to prevent MDX parsing errors
                // We do this FIRST so that parseExercises works on the code that will actually be compiled.
                // This ensures indices match.

                const cleanBlock = (text: string, tagName: string) => {
                    // Regex to find <TagName ...> ... </TagName>
                    // Handles multiline opening tags, whitespace, case insensitivity
                    const regex = new RegExp(`(<${tagName}\\b[^>]*>)([\\s\\S]*?)(<\\/\\s*${tagName}\\s*>)`, 'gi');
                    return text.replace(regex, (_match, openTag, content, closeTag) => {
                        // Check if content contains a markdown table (has separator line like | --- | --- |)
                        const hasTableSeparator = /^\s*\|[\s\-:|]+\|\s*$/m.test(content);

                        if (hasTableSeparator) {
                            // For tables: preserve newlines, only trim each line
                            const cleanedContent = content
                                .split('\n')
                                .map((line: string) => line.trim())
                                .filter((line: string) => line.length > 0)
                                .join('\n'); // Keep newlines for table structure
                            return openTag + '\n' + cleanedContent + '\n' + closeTag;
                        } else {
                            // For non-tables: original behavior (join with space)
                            const cleanedContent = content
                                .split('\n')
                                .map((line: string) => line.trim())
                                .filter((line: string) => line.length > 0)
                                .join(' ');
                            return openTag + cleanedContent + closeTag;
                        }
                    });
                };

                const componentsToClean = [
                    'InteractiveMedia',
                    'Checkpoint',
                    'Quiz',
                    'Option',
                    'FillBlanks',
                    'InlineBlanks',
                    'Ordering',
                    'Matching',
                    'Grouping',
                    'Dialogue'
                ];

                let processedMdx = value || '';
                componentsToClean.forEach(component => {
                    processedMdx = cleanBlock(processedMdx, component);
                });

                // Now parse the CLEANED MDX to find components for data-index injection
                // The order of components in cleaned MDX matches the order in original MDX
                // so the indices will map correctly to the source editor.
                const exercises = parseExercises(processedMdx);

                // Iterate backwards to preserve indices during injection
                for (let i = exercises.length - 1; i >= 0; i--) {
                    const ex = exercises[i];

                    // Inject data-index
                    if (ex.raw.endsWith('/>')) {
                        // Self-closing: replace whole tag
                        const newRaw = ex.raw.slice(0, -2) + ` data-index="${i}" />`;
                        processedMdx = processedMdx.substring(0, ex.startIndex) + newRaw + processedMdx.substring(ex.endIndex);
                    } else {
                        // Paired tag: ONLY replace the opening tag to avoid overwriting nested changes
                        // and to avoid index shifting issues with modified children.
                        const openTagEnd = ex.raw.indexOf('>');
                        if (openTagEnd !== -1) {
                            const oldOpenTag = ex.raw.substring(0, openTagEnd + 1);
                            const newOpenTag = oldOpenTag.slice(0, -1) + ` data-index="${i}">`;

                            // We only replace the opening tag part of the string
                            processedMdx = processedMdx.substring(0, ex.startIndex) + newOpenTag + processedMdx.substring(ex.startIndex + oldOpenTag.length);
                        }
                    }
                }

                const { default: Content } = await evaluate(processedMdx, {
                    ...runtime as any,
                    remarkPlugins: [remarkGfm, remarkGithubBlockquoteAlert],
                    baseUrl: import.meta.url,
                });
                setMDXComponent(() => Content);
                setError(null);
            } catch (err: any) {
                console.error('MDX Compilation Error:', err);
                setError(err.message);
            }
        };

        compileMdx();
    }, [value]);

    // Memoize components map
    const components = useMemo(() => {
        const createEditable = (Component: any, type: string) => ({ ...props }: any) => {
            const index = props['data-index'] ? parseInt(props['data-index']) : -1;
            return (
                <EditableComponent
                    component={Component}
                    type={type}
                    props={props}
                    onEdit={(t, p) => index !== -1 && handleEditClick(t, p, index)}
                />
            );
        };

        return {
            Quiz: createEditable(Quiz, 'Quiz'),
            quiz: createEditable(Quiz, 'Quiz'), // Support lowercase
            Ordering: createEditable(Ordering, 'Ordering'),
            ordering: createEditable(Ordering, 'Ordering'), // Support lowercase
            Matching: createEditable(Matching, 'Matching'),
            matching: createEditable(Matching, 'Matching'), // Support lowercase
            FillBlanks: createEditable(FillBlanks, 'FillBlanks'),
            fillblanks: createEditable(FillBlanks, 'FillBlanks'), // Support lowercase
            Grouping: createEditable(Grouping, 'Grouping'),
            grouping: createEditable(Grouping, 'Grouping'), // Support lowercase
            Media: createEditable(Media, 'Media'),
            media: createEditable(Media, 'Media'), // Support lowercase
            InlineBlanks: InlineBlanks,
            inlineblanks: InlineBlanks, // Support lowercase
            Option: Option,
            option: Option,
            Dialogue: createEditable(Dialogue, 'Dialogue'),
            dialogue: createEditable(Dialogue, 'Dialogue'), // Support lowercase
            Message: Message,
            message: Message, // Support lowercase
            InteractiveMedia: createEditable(InteractiveMedia, 'InteractiveMedia'),
            interactivemedia: createEditable(InteractiveMedia, 'InteractiveMedia'), // Support lowercase
            Checkpoint: Checkpoint,
            checkpoint: Checkpoint,
        };
    }, [value]);

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${className}`}>
            {/* Toolbar */}
            <Toolbar
                onWrap={handleWrap}
                onInsert={insertTextAtCursor}
                onBlock={handleBlock}
                onOpenWizard={setActiveWizard}
            />

            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex gap-2 overflow-x-auto items-center">
                <button onClick={() => setActiveWizard('InlineBlanks')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <Type size={16} className="text-blue-600 dark:text-blue-400" />
                    <span>Inline Blanks</span>
                </button>

                <button onClick={() => setActiveWizard('FillBlanks')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <FormInput size={16} className="text-green-600 dark:text-green-400" />
                    <span>Fill Blanks</span>
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                <button onClick={() => setActiveWizard('Quiz')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <FileQuestion size={16} className="text-purple-600 dark:text-purple-400" />
                    <span>Quiz</span>
                </button>

                <button onClick={() => setActiveWizard('Ordering')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <ListOrdered size={16} className="text-orange-600 dark:text-orange-400" />
                    <span>Ordering</span>
                </button>

                <button onClick={() => setActiveWizard('Matching')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <ArrowLeftRight size={16} className="text-teal-600 dark:text-teal-400" />
                    <span>Matching</span>
                </button>

                <button onClick={() => setActiveWizard('Grouping')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Grouping</span>
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                <button onClick={() => setActiveWizard('Media')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <Image size={16} className="text-pink-600 dark:text-pink-400" />
                    <span>Media</span>
                </button>

                <button onClick={() => setActiveWizard('InteractiveMedia')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <Film size={16} className="text-pink-600 dark:text-pink-400" />
                    <span>Interactive Media</span>
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                <button onClick={() => setActiveWizard('Dialogue')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                    <MessageSquare size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Dialogue</span>
                </button>
            </div>

            {/* Editor & Preview Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Source Editor */}
                <div className={`border-r border-gray-200 dark:border-gray-700 flex overflow-hidden transition-all ${showPreview ? 'w-1/2' : 'w-full'}`}>
                    {/* Line numbers gutter */}
                    <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">
                            #
                        </div>
                        <div
                            ref={gutterRef}
                            className="flex-1 py-4 px-2 font-mono text-sm text-right text-gray-400 dark:text-gray-500 select-none overflow-y-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {value.split('\n').map((_, index) => (
                                <div key={index} className="leading-[1.5] h-[21px]">
                                    {index + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Text editor */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-2 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 min-h-[32px]">
                            <span>Source</span>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white font-medium transition-colors normal-case flex-shrink-0 whitespace-nowrap"
                                title={showPreview ? "Hide Preview" : "Show Preview"}
                            >
                                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                                <span className="text-[10px]">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                            </button>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            onScroll={handleTextareaScroll}
                            wrap="off"
                            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-950 resize-none focus:outline-none leading-[1.5] overflow-auto whitespace-pre"
                            placeholder="Paste MDX content here..."
                            style={{ lineHeight: '1.5' }}
                        />
                    </div>
                </div>

                {/* Live Preview */}
                {showPreview && (
                    <div className="w-1/2 flex flex-col bg-white dark:bg-gray-900">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                            Preview
                        </div>
                        <div className="flex-1 overflow-auto p-8 prose dark:prose-invert max-w-none">
                            {error ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                                    <h3 className="font-bold mb-2">Compilation Error</h3>
                                    <pre className="whitespace-pre-wrap text-sm font-mono">{error}</pre>
                                </div>
                            ) : (
                                MDXComponent && (
                                    <ErrorBoundary key={value} fallback={(err) => (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                                            <h3 className="font-bold mb-2">Runtime Error</h3>
                                            <pre className="whitespace-pre-wrap text-sm font-mono">{err.message}</pre>
                                        </div>
                                    )}>
                                        <MDXComponent components={components} />
                                    </ErrorBoundary>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {renderWizard()}
        </div >
    );
};
