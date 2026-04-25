import { createTheme } from '@mui/material/styles';
import './theme.types';
import { sharedShape, sharedTypography, sharedComponents } from './theme.shared';


const lightTheme = createTheme({
    shape: sharedShape,
    typography: sharedTypography,
    palette: {
        mode: 'light',

        primary: {
            main: '#6D46C0',
            light: '#A882FF',
            dark: '#4D219F',
            contrastText: '#EADEFF',
        },

        secondary: {
            main: '#446061',
            light: '#A7C5C5',
            dark: '#294545',
            contrastText: '#EADEFF',
        },

        error: {
            main: '#C44B5F',
            light: '#F97386',
            dark: '#871C34',
            contrastText: '#FFFFFF',
        },

        success: {
            main: '#4FA574',
            light: '#6FD6A1',
            dark: '#2F7A52',
            contrastText: '#FFFFFF',
        },

        warning: {
            main: '#C7922E',
            light: '#F2C572',
            dark: '#8E6418',
            contrastText: '#FFFFFF',
        },

        background: {
            default: '#FCF9F8',
            paper: '#FFFFFF',
        },

        text: {
            primary: '#1F2020',
            secondary: '#565555',
            disabled: '#767575',
        },

        divider: '#D9D4D3',

        action: {
            active: '#6D46C0',
            hover: 'rgba(109, 70, 192, 0.06)',
            selected: 'rgba(109, 70, 192, 0.12)',
            disabled: 'rgba(86, 85, 85, 0.35)',
            disabledBackground: 'rgba(118, 117, 117, 0.12)',
            focus: 'rgba(109, 70, 192, 0.18)',
        },

        surface: {
            base: '#FCF9F8',
            low: '#FFFFFF',
            mid: '#F7F3F2',
            high: '#F1ECEB',
            highest: '#EBE6E5',
            lowest: '#FFFFFF',
            bright: '#FFFFFF',
            tint: '#D1BCFF',
            inverse: '#0E0E0E',
        },

        textTertiary: '#767575',

        outline: {
            main: '#B4AEAD',
            variant: '#D9D4D3',
        },

        status: {
            errorDim: '#C44B5F',
            errorContainer: '#FDE3E7',
            onErrorContainer: '#871C34',

            successDim: '#4FA574',
            successContainer: '#E3F4EA',
            onSuccessContainer: '#2F7A52',

            warningDim: '#C7922E',
            warningContainer: '#FCEFD8',
            onWarningContainer: '#8E6418',
        },
    },
    components: {
        ...sharedComponents,
        MuiCssBaseline: {
            styleOverrides: (theme) => ({
                html: {
                    colorScheme: 'light',
                },
                body: {
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                },
                '*': {
                    scrollbarColor: `${theme.palette.outline.main} ${theme.palette.surface.mid}`,
                },
                '*::-webkit-scrollbar': {
                    width: 10,
                    height: 10,
                },
                '*::-webkit-scrollbar-track': {
                    background: theme.palette.surface.mid,
                },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.outline.main,
                    borderRadius: 999,
                    border: `2px solid ${theme.palette.surface.mid}`,
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
                    backgroundColor: theme.palette.surface.low,
                }),
                elevation2: ({ theme }) => ({
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    backgroundColor: theme.palette.surface.low,
                }),
                outlined: ({ theme }) => ({
                    borderColor: theme.palette.outline.variant,
                }),
            },
        },

        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.surface.low,
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
                    backgroundColor: '#6D46C0',
                    color: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: '#4D219F',
                    },
                    '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                    },
                }),
                containedSecondary: {
                    backgroundColor: '#E8F1F1',
                    color: '#294545',
                    '&:hover': {
                        backgroundColor: '#DCE9E9',
                    },
                },
                outlined: ({ theme }) => ({
                    borderColor: theme.palette.outline.variant,
                    color: theme.palette.text.primary,
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        backgroundColor: 'rgba(109, 70, 192, 0.04)',
                    },
                }),
                text: ({ theme }) => ({
                    color: theme.palette.primary.main,
                    '&:hover': {
                        backgroundColor: 'rgba(109, 70, 192, 0.06)',
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
                        backgroundColor: 'rgba(109, 70, 192, 0.06)',
                    },
                }),
            },
        },

        MuiChip: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 4,
                    backgroundColor: theme.palette.surface.mid,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.outline.variant}`,
                }),
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.surface.low,
                    borderRadius: 4,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.outline.variant,
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
                        backgroundColor: theme.palette.surface.mid,
                        color: theme.palette.primary.main,
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme.palette.surface.mid,
                        color: theme.palette.primary.main,
                        borderLeft: `2px solid ${theme.palette.primary.main}`,
                    },
                    '&.Mui-selected:hover': {
                        backgroundColor: theme.palette.surface.high,
                    },
                }),
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: ({ theme }) => ({
                    backgroundColor: theme.palette.surface.inverse,
                    color: '#FCF9F8',
                    border: `1px solid ${theme.palette.outline.main}`,
                }),
                arrow: ({ theme }) => ({
                    color: theme.palette.surface.inverse,
                }),
            },
        },

        MuiAlert: {
            styleOverrides: {
                standardError: {
                    backgroundColor: '#FDE3E7',
                    color: '#871C34',
                    border: '1px solid #F97386',
                },
            },
        },
    },
});

export default lightTheme;