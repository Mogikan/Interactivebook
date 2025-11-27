import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SettingsContextType {
    showHints: boolean;
    toggleShowHints: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [showHints, setShowHints] = useState<boolean>(() => {
        const saved = localStorage.getItem('yazula_settings_showHints');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('yazula_settings_showHints', JSON.stringify(showHints));
    }, [showHints]);

    const toggleShowHints = () => {
        setShowHints(prev => !prev);
    };

    return (
        <SettingsContext.Provider value={{ showHints, toggleShowHints }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
