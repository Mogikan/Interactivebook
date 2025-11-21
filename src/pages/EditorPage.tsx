
import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import remarkGithubBlockquoteAlert from 'remark-github-blockquote-alert';
import { Quiz, Option } from '../components/exercises/Quiz';
import { Ordering } from '../components/exercises/Ordering';
import { Matching } from '../components/exercises/Matching';
import { FillBlanks } from '../components/exercises/FillBlanks';
import { InlineBlanks } from '../components/exercises/InlineBlanks';
import { Grouping } from '../components/exercises/Grouping';
import { Media } from '../components/exercises/Media';
import { QuizWizard } from '../components/editor/wizards/QuizWizard';
import { OrderingWizard } from '../components/editor/wizards/OrderingWizard';
import { MatchingWizard } from '../components/editor/wizards/MatchingWizard';
import { FillBlanksWizard } from '../components/editor/wizards/FillBlanksWizard';
import { GroupingWizard } from '../components/editor/wizards/GroupingWizard';
import { MediaWizard } from '../components/editor/wizards/MediaWizard';
import { generateComponentCode, parseExercises, type ExerciseComponent } from '../utils/mdxParser';
import { EditableComponent } from '../components/editor/EditableComponent';
import { Toolbar } from '../components/editor/Toolbar';
import { InlineBlanksWizard } from '../components/editor/wizards/InlineBlanksWizard';
import { TableWizard } from '../components/editor/wizards/TableWizard';
import { Upload, Copy, Save, Trash2, FileQuestion, ListOrdered, ArrowLeftRight, FormInput, Type, Layers, Image } from 'lucide-react';

export default function EditorPage() {
    const [mdxContent, setMdxContent] = useState<string>(() => {
        return localStorage.getItem('yazula_editor_content') || '';
    });
    const [activeWizard, setActiveWizard] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [MDXComponent, setMDXComponent] = useState<React.ComponentType<any> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        localStorage.setItem('yazula_editor_content', mdxContent);
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
            localStorage.removeItem('yazula_editor_content');
        }
    };

    const insertTextAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = mdxContent.substring(0, start);
        const after = mdxContent.substring(end);

        const newContent = before + text + after;
        setMdxContent(newContent);

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
        const selection = mdxContent.substring(start, end);
        const before = mdxContent.substring(0, start);
        const after = mdxContent.substring(end);

        const newContent = before + prefix + selection + suffix + after;
        setMdxContent(newContent);

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
        const beforeSelection = mdxContent.substring(0, start);
        const lastNewLine = beforeSelection.lastIndexOf('\n');
        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;

        const beforeLine = mdxContent.substring(0, lineStart);
        const lineContent = mdxContent.substring(lineStart, end); // Includes selection
        const after = mdxContent.substring(end);

        const newContent = beforeLine + prefix + lineContent + after;
        setMdxContent(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 100);
    };

    const replaceComponentAtIndex = (component: ExerciseComponent, index: number) => {
        // We need to re-parse to get fresh indices because manual edits might have shifted things
        const exercises = parseExercises(mdxContent);
        const target = exercises[index];

        if (!target) {
            console.error('Target component not found at index', index);
            return;
        }

        const newCode = generateComponentCode(component);
        const before = mdxContent.substring(0, target.startIndex);
        const after = mdxContent.substring(target.endIndex);

        setMdxContent(before + newCode + after);
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

        const exercises = parseExercises(mdxContent);
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
            const exercises = parseExercises(mdxContent);
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

                    {activeWizard === 'Media' && <MediaWizard {...commonProps} />}
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
                // Inject data-index attributes into the source MDX before compilation
                // This allows us to track components even after compilation
                const exercises = parseExercises(mdxContent);
                let processedMdx = mdxContent;

                // Iterate backwards to preserve indices
                for (let i = exercises.length - 1; i >= 0; i--) {
                    const ex = exercises[i];
                    // We insert the data-index prop into the raw tag
                    // e.g. <Quiz ... /> -> <Quiz data-index="0" ... />

                    // Find the position to insert
                    // If self-closing: />
                    // If paired: >

                    // Simple regex replacement on the raw string of the component
                    let newRaw = ex.raw;
                    if (newRaw.endsWith('/>')) {
                        newRaw = newRaw.slice(0, -2) + ` data-index="${i}" />`;
                    } else {
                        const openTagEnd = newRaw.indexOf('>');
                        if (openTagEnd !== -1) {
                            newRaw = newRaw.slice(0, openTagEnd) + ` data-index="${i}"` + newRaw.slice(openTagEnd);
                        }
                    }

                    processedMdx = processedMdx.substring(0, ex.startIndex) + newRaw + processedMdx.substring(ex.endIndex);
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
    }, [mdxContent]);

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
        };
    }, [mdxContent]); // Re-create if needed, but actually stable. 
    // Wait, handleEditClick depends on mdxContent state (via closure?)
    // Yes, handleEditClick uses parseExercises(mdxContent).
    // So components map needs to depend on mdxContent or handleEditClick needs to be stable ref?
    // handleEditClick is recreated on every render.
    // So components map updates on every render. That's fine.

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <h1 className="text-xl font-bold">Editor</h1>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm cursor-pointer transition-colors font-medium">
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
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm transition-colors font-medium"
                    >
                        <Save size={16} />
                        <span>Save As...</span>
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(mdxContent);
                            alert('Copied to clipboard!');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors font-medium"
                    >
                        <Copy size={16} />
                        <span>Copy MDX</span>
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors font-medium"
                    >
                        <Trash2 size={16} />
                        <span>Clear</span>
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <Toolbar
                onWrap={handleWrap}
                onInsert={insertTextAtCursor}
                onBlock={handleBlock}
                onOpenWizard={setActiveWizard}
            />

            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex gap-2 overflow-x-auto items-center">

                <button onClick={() => setActiveWizard('InlineBlanks')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <Type size={16} className="text-blue-600 dark:text-blue-400" />
                    <span>Inline Blanks</span>
                </button>

                <button onClick={() => setActiveWizard('FillBlanks')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <FormInput size={16} className="text-green-600 dark:text-green-400" />
                    <span>Fill Blanks</span>
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                <button onClick={() => setActiveWizard('Quiz')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <FileQuestion size={16} className="text-purple-600 dark:text-purple-400" />
                    <span>Quiz</span>
                </button>

                <button onClick={() => setActiveWizard('Ordering')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <ListOrdered size={16} className="text-orange-600 dark:text-orange-400" />
                    <span>Ordering</span>
                </button>

                <button onClick={() => setActiveWizard('Matching')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <ArrowLeftRight size={16} className="text-teal-600 dark:text-teal-400" />
                    <span>Matching</span>
                </button>

                <button onClick={() => setActiveWizard('Grouping')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Grouping</span>
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                <button onClick={() => setActiveWizard('Media')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap transition-colors">
                    <Image size={16} className="text-pink-600 dark:text-pink-400" />
                    <span>Media</span>
                </button>
            </div>

            {/* Editor & Preview Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Source Editor */}
                <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Source
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={mdxContent}
                        onChange={e => setMdxContent(e.target.value)}
                        className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-950 resize-none focus:outline-none"
                        placeholder="Paste MDX content here or load a file..."
                    />
                </div>

                {/* Live Preview */}
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
                            MDXComponent && <MDXComponent components={components} />
                        )}
                    </div>
                </div>
            </div>

            {renderWizard()}
        </div>
    );
}
