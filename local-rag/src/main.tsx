import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import './index.css';
import App from './App.tsx';
import darkTheme from './themes/darkTheme';
import lightTheme from './themes/lightTheme';
import '@fontsource/material-symbols-outlined';

function Root() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const appTheme = useMemo(() => {
        return theme === 'dark' ? darkTheme : lightTheme;
    }, [theme]);
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeProvider theme={appTheme}>
            <CssBaseline />
            <App selectedTheme={theme} onToggleTheme={toggleTheme} />
        </ThemeProvider>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);