import { createTheme } from '@mui/material/styles';
import './theme.types';
import { sharedShape, sharedTypography, sharedComponents } from './theme.shared';


const darkTheme = createTheme({
    shape: sharedShape,
    typography: sharedTypography,
    palette: {
        mode: 'dark',

        primary: {
            main: '#D1BCFF',
            light: '#EADEFF',
            dark: '#A882FF',
            contrastText: '#4D219F',
        },

        secondary: {
            main: '#AECCCC',
            light: '#CAE8E8',
            dark: '#A0BEBE',
            contrastText: '#294545',
        },

        error: {
            main: '#F97386',
            light: '#FF97A3',
            dark: '#C44B5F',
            contrastText: '#490013',
        },

        success: {
            main: '#6FD6A1',
            light: '#98E5BC',
            dark: '#3FA06F',
            contrastText: '#0D3B24',
        },

        warning: {
            main: '#F2C572',
            light: '#F7D99E',
            dark: '#BE9443',
            contrastText: '#4A320C',
        },

        background: {
            default: '#0E0E0E',
            paper: '#131313',
        },

        text: {
            primary: '#E7E5E4',
            secondary: '#ACABAA',
            disabled: '#767575',
        },

        divider: '#383838',

        action: {
            active: '#D1BCFF',
            hover: 'rgba(209, 188, 255, 0.08)',
            selected: 'rgba(209, 188, 255, 0.14)',
            disabled: 'rgba(231, 229, 228, 0.3)',
            disabledBackground: 'rgba(72, 72, 72, 0.4)',
            focus: 'rgba(209, 188, 255, 0.22)',
        },

        surface: {
            base: '#0E0E0E',
            low: '#131313',
            mid: '#191A1A',
            high: '#1F2020',
            highest: '#262626',
            lowest: '#000000',
            bright: '#2C2C2C',
            tint: '#D1BCFF',
            inverse: '#FCF9F8',
        },

        textTertiary: '#565555',

        outline: {
            main: '#767575',
            variant: '#484848',
        },

        status: {
            errorDim: '#C44B5F',
            errorContainer: '#871C34',
            onErrorContainer: '#FF97A3',

            successDim: '#3FA06F',
            successContainer: '#173D2A',
            onSuccessContainer: '#98E5BC',

            warningDim: '#BE9443',
            warningContainer: '#4A3412',
            onWarningContainer: '#F7D99E',
        },
    },
    components: {
        ...sharedComponents,
        MuiCssBaseline: {
            styleOverrides: (theme) => ({
                html: {
                    colorScheme: 'dark',
                },
                body: {
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                },
                '*': {
                    scrollbarColor: `${theme.palette.outline.variant} ${theme.palette.surface.low}`,
                },
                '*::-webkit-scrollbar': {
                    width: 10,
                    height: 10,
                },
                '*::-webkit-scrollbar-track': {
                    background: theme.palette.surface.low,
                },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.outline.variant,
                    borderRadius: 999,
                    border: `2px solid ${theme.palette.surface.low}`,
                },
            }),
        },

        MuiPaper: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundImage: 'none',
                    backgroundColor: theme.palette.surface.low,
                    border: `1px solid ${theme.palette.outline.variant}`,
                    borderRadius: 4,
                }),
                elevation1: ({ theme }) => ({
                    boxShadow: 'none',
                    backgroundColor: theme.palette.surface.mid,
                }),
                elevation2: ({ theme }) => ({
                    boxShadow: 'none',
                    backgroundColor: theme.palette.surface.high,
                }),
                outlined: ({ theme }) => ({
                    borderColor: theme.palette.outline.variant,
                }),
            },
        },

        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.surface.mid,
                    border: `1px solid ${theme.palette.outline.variant}`,
                    boxShadow: 'none',
                    borderRadius: 8,
                }),
            },
        },

        MuiDivider: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderColor: theme.palette.outline.variant,
                }),
            },
        },

        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    paddingInline: 14,
                    minHeight: 36,
                },
                containedPrimary: ({ theme }) => ({
                    backgroundColor: '#A882FF',
                    color: '#000000',
                    '&:hover': {
                        backgroundColor: '#9B75F1',
                    },
                    '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                    },
                }),
                containedSecondary: {
                    backgroundColor: '#244040',
                    color: '#A7C5C5',
                    '&:hover': {
                        backgroundColor: '#294545',
                    },
                },
                outlined: ({ theme }) => ({
                    borderColor: theme.palette.outline.variant,
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: 'rgba(209, 188, 255, 0.06)',
                    },
                }),
                text: ({ theme }) => ({
                    color: theme.palette.primary.main,
                    '&:hover': {
                        backgroundColor: 'rgba(209, 188, 255, 0.08)',
                    },
                }),
            },
        },

        MuiIconButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.text.secondary,
                    borderRadius: 4,
                    '&:hover': {
                        color: theme.palette.primary.main,
                        backgroundColor: 'rgba(209, 188, 255, 0.08)',
                    },
                }),
            },
        },

        MuiChip: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 4,
                    backgroundColor: theme.palette.surface.high,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.outline.variant}`,
                }),
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.surface.mid,
                    borderRadius: 4,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(72, 72, 72, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 1,
                    },
                    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.error.main,
                    },
                }),
                input: ({ theme }) => ({
                    color: theme.palette.text.primary,
                    '&::placeholder': {
                        color: theme.palette.text.secondary,
                        opacity: 1,
                    },
                }),
            },
        },

        MuiInputBase: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.text.primary,
                }),
            },
        },

        MuiFormLabel: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.text.secondary,
                    fontFamily: `'Space Grotesk', sans-serif`,
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    '&.Mui-focused': {
                        color: theme.palette.primary.main,
                    },
                    '&.Mui-error': {
                        color: theme.palette.error.main,
                    },
                }),
            },
        },

        MuiTabs: {
            styleOverrides: {
                indicator: ({ theme }) => ({
                    backgroundColor: theme.palette.primary.main,
                    height: 2,
                }),
            },
        },

        MuiTab: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.text.secondary,
                    fontFamily: `'Space Grotesk', sans-serif`,
                    textTransform: 'none',
                    minHeight: 40,
                    '&.Mui-selected': {
                        color: theme.palette.primary.main,
                    },
                    '&:hover': {
                        color: theme.palette.primary.main,
                    },
                }),
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 4,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                        backgroundColor: theme.palette.surface.high,
                        color: theme.palette.primary.main,
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme.palette.surface.high,
                        color: theme.palette.primary.main,
                        borderLeft: `2px solid ${theme.palette.primary.main}`,
                    },
                    '&.Mui-selected:hover': {
                        backgroundColor: theme.palette.surface.highest,
                    },
                }),
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: ({ theme }) => ({
                    backgroundColor: theme.palette.surface.highest,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.outline.variant}`,
                }),
                arrow: ({ theme }) => ({
                    color: theme.palette.surface.highest,
                }),
            },
        },

        MuiAlert: {
            styleOverrides: {
                standardError: {
                    backgroundColor: '#871C34',
                    color: '#FF97A3',
                    border: '1px solid #F97386',
                },
            },
        },
    },
});

export default darkTheme;