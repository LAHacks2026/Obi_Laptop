import type { ReactNode } from 'react';
import { Box } from '@mui/material';

type MainCanvasProps = {
    topBar?: ReactNode;
    canvasContent: ReactNode;
    bottomDock?: ReactNode;
    contentMaxWidth?: number | string;
};

export default function MainCanvas({
    topBar,
    canvasContent,
    bottomDock,
    contentMaxWidth = 960,
}: MainCanvasProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: '100%',
                minHeight: 0,
            }}
        >
            {/* Top Bar */}
            {topBar && (
                <Box
                    sx={(theme) => ({
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        px: 4,
                        backdropFilter: 'blur(12px)',
                        borderBottom: `1px solid ${theme.palette.outline.variant}`,
                    })}
                >
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: contentMaxWidth,
                            mx: 'auto',
                        }}
                    >
                        {topBar}
                    </Box>
                </Box>
            )}

            {/* Main Content */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: contentMaxWidth,
                        mx: 'auto',
                        minHeight: 0,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {canvasContent}
                </Box>
            </Box>

            {/* Bottom Dock */}
            {bottomDock && (
                <Box sx={{ px: 4, flexShrink: 0, }} >
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: contentMaxWidth,
                            mx: 'auto',
                        }}
                    >
                        {bottomDock}
                    </Box>
                </Box>
            )}
        </Box>
    );
}