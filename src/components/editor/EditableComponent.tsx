import React from 'react';
import { normalizeProps } from '../../utils/propsNormalizer';

interface EditableComponentProps {
    component: React.ComponentType<any>;
    type: string;
    props: any;
    onEdit: (type: string, props: any) => void;
}

export const EditableComponent: React.FC<EditableComponentProps> = ({ component: Component, type, props, onEdit }) => {
    const normalizedProps = normalizeProps(props);

    return (
        <div className="relative group border border-transparent hover:border-blue-500 rounded p-1 transition-colors">
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(type, normalizedProps);
                    }}
                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-blue-700"
                >
                    Edit
                </button>
            </div>
            <Component {...normalizedProps} />
        </div>
    );
};
