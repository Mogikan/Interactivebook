import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import { Quiz, Option } from './exercises/Quiz';
import { FillBlanks } from './exercises/FillBlanks';
import { Media } from './exercises/Media';
import { Matching } from './exercises/Matching';
import { Ordering } from './exercises/Ordering';
import { Grouping } from './exercises/Grouping';
import { InlineBlanks } from './exercises/InlineBlanks';

const components = {
    Quiz,
    Option,
    FillBlanks,
    InlineBlanks,
    Media,
    Matching,
    Ordering,
    Grouping,
    // Add other components here
    h1: (props: any) => <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-800 dark:text-gray-100" {...props} />,
    p: (props: any) => <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300" {...props} />,
    ul: (props: any) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
    li: (props: any) => <li className="ml-4" {...props} />,
};

export const MDXComponentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <MDXProvider components={components}>{children}</MDXProvider>;
};
