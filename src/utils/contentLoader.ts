import yaml from 'js-yaml';

export interface CourseItem {
    title: string;
    path?: string;
    items?: CourseItem[];
}

export interface CourseStructure {
    title: string;
    structure: CourseItem[];
}

export async function loadCourseStructure(): Promise<CourseStructure> {
    // Import yaml as raw string
    const modules = import.meta.glob('../content/course.yaml', { query: '?raw', import: 'default', eager: true });
    const yamlContent = modules['../content/course.yaml'] as string;
    return yaml.load(yamlContent) as CourseStructure;
}
