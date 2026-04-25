import { styled, Switch, Box, Typography } from '@mui/material';

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(6px)',
        '&.Mui-checked': {
            color: theme.palette.primary.light,
            transform: 'translateX(22px)',
            '& .MuiSwitch-thumb:before': {
                content: "'dark_mode'", // Material Symbol for Moon
                color: theme.palette.primary.main,
            },
            '& + .MuiSwitch-track': { // Moon Track
                opacity: 1,
                backgroundColor: theme.palette.primary.main,
            },
        },
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: theme.palette.surface.bright,
        width: 32,
        height: 32,
        '&::before': {
            content: "'light_mode'", // Material Symbol for Sun
            fontFamily: 'Material Symbols Outlined',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: theme.palette.primary.dark,
        },
    },
    '& .MuiSwitch-track': { // Sun Track
        opacity: 1,
        backgroundColor: theme.palette.primary.dark,
        borderRadius: 20 / 2,
    },
}));

type ThemeToggleButtonProps = {
    mode: 'light' | 'dark';
    onToggle: () => void;
};

function ThemeToggleButton({ mode, onToggle }: ThemeToggleButtonProps) {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 1,
            mt: 1
        }}>
            <Typography
                variant="overline"
                sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.65rem'
                }}
            >
                {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Typography>
            <MaterialUISwitch
                checked={mode === 'dark'}
                onChange={onToggle}
            />
        </Box>
    );
}

export default ThemeToggleButton;