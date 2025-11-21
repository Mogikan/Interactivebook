import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { MDXComponentsProvider } from './components/MDXComponentsProvider';
import { loadCourseStructure, type CourseStructure, type CourseItem } from './utils/contentLoader';
import EditorPage from './pages/EditorPage';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
    return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  }

  if (!course) {
    return <div className="flex items-center justify-center h-screen">Ошибка загрузки курса</div>;
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
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden relative">
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

      {/* Sidebar Overlay (Mobile) */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-40 w-80 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        )}
      >
        <div className="p-6 pt-20 md:pt-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
            {!isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Свернуть меню"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          <nav>
            {course.structure.map((item, idx) => (
              <SidebarItem key={idx} item={item} />
            ))}
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link to="/editor" className="flex items-center py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <span className="mr-2">✏️</span>
                Editor
              </Link>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full">
        {/* Desktop Toggle Button (when sidebar closed) */}
        {!isMobile && !isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className={clsx(
          "mx-auto transition-all duration-300",
          location.pathname.startsWith('/editor')
            ? "w-full h-full"
            : "max-w-4xl px-4 md:px-8 py-20 md:py-12"
        )}>
          <MDXComponentsProvider>
            <Routes>
              {routes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {route.frontmatter && (
                        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                          {route.frontmatter.title && (
                            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                              {route.frontmatter.title}
                            </h1>
                          )}
                          {route.frontmatter.description && (
                            <p className="text-xl text-gray-600 dark:text-gray-400">
                              {route.frontmatter.description}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="prose dark:prose-invert max-w-none">
                        <route.component />
                      </div>
                    </motion.div>
                  }
                />
              ))}
              <Route path="/" element={
                <div className="text-center py-20">
                  <h2 className="text-2xl font-semibold mb-4">Добро пожаловать в {course.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400">Выберите урок в меню слева, чтобы начать.</p>
                </div>
              } />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MDXComponentsProvider>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
