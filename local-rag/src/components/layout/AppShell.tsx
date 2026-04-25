import type { ReactNode } from 'react';
import { Box } from '@mui/material';

type AppShellProps = {
    sideBar: ReactNode;
    mainCanvas: ReactNode;
};

const SIDEBAR_WIDTH = 256;

export default function AppShell({
    sideBar,
    mainCanvas,
}: AppShellProps) {
    return (
        <Box
            sx={(theme) => ({
                flex: 1,
                minHeight: '100vh',
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
            })}
        >
            {/* Fixed sidebar */}
            <Box
                component="aside"
                sx={(theme) => ({
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: SIDEBAR_WIDTH,
                    height: '100vh',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    py: 2,
                    backgroundColor: theme.palette.surface.base,
                    borderRight: `1px solid ${theme.palette.outline.variant}`,
                })}
            >
                {sideBar}
            </Box>

            {/* Main canvas */}
            <Box
                component="main"
                sx={(theme) => ({
                    ml: `${SIDEBAR_WIDTH}px`,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundColor: theme.palette.background.default,
                    overflow: 'hidden',
                })}
            >
                {/* Decorative Background Circle 1 */}
                <Box
                    aria-hidden
                    sx={(theme) => ({
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.main,
                        opacity: 0.05,
                        filter: 'blur(120px)',
                        transform: 'translate(50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                    })}
                />
                {/* Decorative Background Circle 2 */}
                <Box
                    aria-hidden
                    sx={(theme) => ({
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.dark,
                        opacity: 0.1,
                        filter: 'blur(100px)',
                        transform: 'translate(-33%, 33%)',
                        pointerEvents: 'none',
                    })}
                />

                {/* Main content area */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        width: '100%',
                        position: 'relative',
                        zIndex: 1,
                        minHeight: 0,
                    }}
                >
                    {mainCanvas}
                </Box>
            </Box>
        </Box>
    );
}