import { Box, Icon, InputBase } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

type SearchBarProps = {
    value: string;
    onChange: (value: string) => void;
    onSearch: (value: string) => void;
    placeholder?: string;
    size?: 'default' | 'large';
    autoFocus?: boolean;
};

export default function SearchBar({
    value,
    onChange,
    onSearch,
    placeholder = "Search your files...",
    size = 'default',
    autoFocus,
}: SearchBarProps) {
    const theme = useTheme();
    const large = size === 'large';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: large ? 3 : 2,
                py: large ? 1.75 : 1.25,
                borderRadius: 3,
                backgroundColor: theme.palette.surface.mid,
                border: `1px solid ${theme.palette.outline.variant}`,
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
                '&:focus-within': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
            }}
        >
            <Icon
                sx={{
                    color: theme.palette.text.secondary,
                    fontSize: large ? 24 : 20,
                    flexShrink: 0,
                }}
            >
                search
            </Icon>
            <InputBase
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && value.trim()) {
                        onSearch(value.trim());
                    }
                }}
                placeholder={placeholder}
                autoFocus={autoFocus}
                fullWidth
                sx={{
                    fontSize: large ? '1.05rem' : '0.875rem',
                    color: theme.palette.text.primary,
                    '& input::placeholder': {
                        color: theme.palette.text.secondary,
                        opacity: 1,
                    },
                    lineHeight: 1.5,
                }}
            />
        </Box>
    );
}
