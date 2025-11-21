/// <reference types="vite/client" />

declare module '*.mdx' {
    import type { ComponentType, PropsWithChildren } from 'react'
    const component: ComponentType<PropsWithChildren>
    export default component
    export const frontmatter: Record<string, any>
}
