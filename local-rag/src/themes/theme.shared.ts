import type { ThemeOptions } from '@mui/material/styles';

export const sharedShape: ThemeOptions['shape'] = {
    borderRadius: 4,
};

export const sharedTypography: ThemeOptions['typography'] = {
    fontFamily: `'Inter', sans-serif`,
    h1: { fontFamily: `'Inter', sans-serif`, fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: `'Inter', sans-serif`, fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontFamily: `'Inter', sans-serif`, fontWeight: 650, letterSpacing: '-0.01em' },
    h4: { fontFamily: `'Inter', sans-serif`, fontWeight: 650 },
    h5: { fontFamily: `'Inter', sans-serif`, fontWeight: 600 },
    h6: { fontFamily: `'Inter', sans-serif`, fontWeight: 600 },
    body1: { fontFamily: `'Inter', sans-serif` },
    body2: { fontFamily: `'Inter', sans-serif` },
    button: {
        fontFamily: `'Space Grotesk', sans-serif`,
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.01em',
    },
    caption: {
        fontFamily: `'Space Grotesk', sans-serif`,
        letterSpacing: '0.04em',
    },
    overline: {
        fontFamily: `'Space Grotesk', sans-serif`,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
    },
};

export const sharedComponents: ThemeOptions['components'] = {
    MuiIcon: {
        defaultProps: {
            baseClassName: 'material-symbols-outlined',
        },
    },
};