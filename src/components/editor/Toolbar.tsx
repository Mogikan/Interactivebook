import React from 'react';
import {
    Bold, Italic, Underline, Strikethrough, Highlighter,
    Subscript, Superscript, Code,
    Heading1, Heading2, Heading3, Quote,
    List, ListOrdered, CheckSquare,
    Link, Image, Table, Minus, Code2,
    AlertTriangle
} from 'lucide-react';

interface ToolbarProps {
    onWrap: (prefix: string, suffix: string) => void;
    onInsert: (text: string) => void;
    onBlock: (prefix: string) => void; // For line-start insertions like headings/lists
    onOpenWizard: (name: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onWrap, onInsert, onBlock, onOpenWizard }) => {

    const Button = ({ onClick, icon: Icon, title }: { onClick: () => void, icon: any, title: string }) => (
        <button
            onClick={onClick}
            title={title}
            className="w-8 h-8 p-0 shrink-0 flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
            <Icon size={18} />
        </button>
    );

    const Divider = () => <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />;

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 items-center">
            {/* Text Style */}
            <Button onClick={() => onWrap('**', '**')} icon={Bold} title="Bold" />
            <Button onClick={() => onWrap('*', '*')} icon={Italic} title="Italic" />
            <Button onClick={() => onWrap('<u>', '</u>')} icon={Underline} title="Underline" />
            <Button onClick={() => onWrap('~~', '~~')} icon={Strikethrough} title="Strikethrough" />
            <Button onClick={() => onWrap('<mark>', '</mark>')} icon={Highlighter} title="Highlight" />
            <Button onClick={() => onWrap('`', '`')} icon={Code} title="Inline Code" />
            <Button onClick={() => onWrap('<sub>', '</sub>')} icon={Subscript} title="Subscript" />
            <Button onClick={() => onWrap('<sup>', '</sup>')} icon={Superscript} title="Superscript" />

            <Divider />

            {/* Blocks */}
            <Button onClick={() => onBlock('# ')} icon={Heading1} title="Heading 1" />
            <Button onClick={() => onBlock('## ')} icon={Heading2} title="Heading 2" />
            <Button onClick={() => onBlock('### ')} icon={Heading3} title="Heading 3" />
            <Button onClick={() => onBlock('> ')} icon={Quote} title="Quote" />
            <Button onClick={() => onWrap('```\n', '\n```')} icon={Code2} title="Code Block" />

            <Divider />

            {/* Lists */}
            <Button onClick={() => onBlock('- ')} icon={List} title="Bullet List" />
            <Button onClick={() => onBlock('1. ')} icon={ListOrdered} title="Numbered List" />
            <Button onClick={() => onBlock('- [ ] ')} icon={CheckSquare} title="Checkbox List" />

            <Divider />

            {/* Insert */}
            <Button onClick={() => onWrap('[', '](url)')} icon={Link} title="Link" />
            <Button onClick={() => onInsert('![Alt text](image-url)')} icon={Image} title="Image" />
            <Button onClick={() => onOpenWizard('Table')} icon={Table} title="Table" />
            <Button onClick={() => onInsert('\n---\n')} icon={Minus} title="Horizontal Rule" />

            <Divider />

            {/* Admonitions */}
            <div className="relative w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors" title="Insert Admonition">
                <AlertTriangle size={18} />
                <select
                    onChange={(e) => {
                        if (e.target.value) {
                            onBlock(`> [!${e.target.value}]\n> `);
                            e.target.value = ""; // Reset selection
                        }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                    defaultValue=""
                >
                    <option value="" disabled>Insert Admonition...</option>
                    <option value="NOTE">Note</option>
                    <option value="TIP">Tip</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="WARNING">Warning</option>
                    <option value="CAUTION">Caution</option>
                </select>
            </div>
        </div>
    );
};
