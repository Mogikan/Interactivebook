import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { MDXComponentsProvider } from './components/MDXComponentsProvider';
import { loadCourseStructure, type CourseStructure, type CourseItem } from './utils/contentLoader';
import EditorPage from './pages/EditorPage';
import { clsx } from 'clsx';
import { Helmet, HelmetProvider } from 'react-helmet-async';
// Import all MDX files eagerly
const mdxModules = import.meta.glob('./content/**/*.mdx', { eager: true });

function SidebarItem({ item, depth = 0 }: { item: CourseItem; depth?: number }) {
  const location = useLocation();
  const isActive = item.path && location.pathname === item.path;
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.items && item.items.length > 0;

  return (
    <div className="mb-1">
      <div
        className={clsx(
          "flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
          depth > 0 && "ml-4"
        )}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            className="mr-2 w-8 h-8 p-0 shrink-0 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg
              className={clsx("w-8 h-8 transition-transform", isOpen ? "rotate-90" : "")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {item.path ? (
          <Link to={item.path} className="flex-1 block">
            {item.title}
          </Link>
        ) : (
          <span className="flex-1" onClick={() => hasChildren && setIsOpen(!isOpen)}>
            {item.title}
          </span>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="border-l border-gray-200 dark:border-gray-700 ml-5">
          {item.items!.map((subItem, idx) => (
            <SidebarItem key={idx} item={subItem} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const [course, setCourse] = useState<CourseStructure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseStructure().then(data => {
      setCourse(data);
      setLoading(false);
    });
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change if mobile
  const location = useLocation();
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location, isMobile]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!course) {
    return <div className="flex items-center justify-center h-screen">Error loading course</div>;
  }

  // Flatten routes for Router
  const routes: { path: string; component: React.ComponentType; frontmatter?: Record<string, any> }[] = [];

  // Helper to find MDX component for a path
  const findComponent = (path: string) => {
    // Normalize path to match glob keys
    // path: /intro/lesson1 -> ./content/intro/lesson1.mdx
    const key = `./content${path}.mdx`;
    const module = mdxModules[key] as any;
    return {
      Component: module?.default,
      frontmatter: module?.frontmatter
    };
  };

  const traverse = (items: CourseItem[]) => {
    items.forEach(item => {
      if (item.path) {
        const { Component, frontmatter } = findComponent(item.path);
        if (Component) {
          routes.push({ path: item.path, component: Component, frontmatter });
        }
      }
      if (item.items) {
        traverse(item.items);
      }
    });
  };

  traverse(course.structure);

  return (
    <HelmetProvider>
      <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden relative">
        <Helmet>
          <title>{course.title}</title>
          <meta name="description" content={`Learn ${course.title} interactively`} />
        </Helmet>
        {/* Mobile Header */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 z-20">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-4 font-bold truncate">{course.title}</span>
        </div>

        {/* Sidebar */}
        <div
          className={clsx(
            "fixed inset-y-0 left-0 z-30 w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {course.structure.map((item, index) => (
                <SidebarItem key={index} item={item} />
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <Link
                to="/editor"
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Open Editor
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={clsx(
          "flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-all duration-200",
          location.pathname.startsWith('/editor') ? "w-full h-full" : "max-w-6xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8"
        )}>
          <Routes>
            {routes.map(({ path, component: Component, frontmatter }) => (
              <Route
                key={path}
                path={path}
                element={
                  <>
                    <Helmet>
                      <title>{frontmatter?.title ? `${frontmatter.title} - ${course.title}` : course.title}</title>
                      {frontmatter?.description && <meta name="description" content={frontmatter.description} />}
                    </Helmet>
                    <MDXComponentsProvider>
                      <article className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl">
                        <Component />
                      </article>
                    </MDXComponentsProvider>
                  </>
                }
              />
            ))}
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/" element={<Navigate to={routes[0]?.path || '/editor'} replace />} />
          </Routes>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </HelmetProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
