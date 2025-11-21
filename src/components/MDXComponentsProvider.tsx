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
};

export const MDXComponentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <MDXProvider components={components}>{children}</MDXProvider>;
};
