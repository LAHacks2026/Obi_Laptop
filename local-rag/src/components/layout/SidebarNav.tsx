import { Box, Button, Typography, Icon } from '@mui/material';
import ThemeToggleButton from '../ui/ThemeToggleButton';

export type NavKey = 'home' | 'chat' | 'files' | 'vault' | 'history' | 'settings' | 'about';

type NavItemProps = {
    icon: string;
    label: string;
    active?: boolean;
    onClick: () => void;
};

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
    return (
        <Box
            onClick={onClick}
            sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 1.05,
                mx: 1.25,
                my: 0.25,
                borderRadius: 1,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 140ms ease',
                color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: active ? theme.palette.action.selected : 'transparent',
                border: active
                    ? `1px solid ${theme.palette.primary.main}`
                    : `1px solid transparent`,
                boxShadow: active
                    ? `inset 3px 0 0 ${theme.palette.primary.main}`
                    : 'none',
                '&:hover': {
                    backgroundColor: active
                        ? theme.palette.action.selected
                        : theme.palette.action.hover,
                    color: active
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    transform: 'translateX(1px)',
                },
            })}
        >
            <Icon
                sx={{
                    color: 'inherit',
                    fontSize: 21,
                    opacity: active ? 1 : 0.82,
                    fontVariationSettings: active ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 500',
                    transition: 'all 140ms ease',
                }}
            >
                {icon}
            </Icon>

            <Typography
                variant="overline"
                sx={{
                    letterSpacing: '0.13em',
                    lineHeight: 1.2,
                    fontWeight: active ? 700 : 600,
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

type SidebarNavProps = {
    activeItem: NavKey;
    onSelect: (item: NavKey) => void;
    onNewChat?: () => void;
    selectedTheme: 'light' | 'dark';
    onThemeChange: () => void;
};

function SidebarNav({
    activeItem,
    onSelect,
    onNewChat,
    selectedTheme,
    onThemeChange,
}: SidebarNavProps) {
    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                pt: 2.5,
            }}
        >
            {/* Brand */}
            <Box
                sx={{
                    px: 3,
                    mb: 3.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Box
                    sx={(theme) => ({
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: theme.palette.primary.contrastText,
                    })}
                >
                    <Icon>tokens</Icon>
                </Box>

                <Box>
                    <Typography
                        variant="overline"
                        sx={(theme) => ({
                            display: 'block',
                            color: theme.palette.text.primary,
                            lineHeight: 1.1,
                        })}
                    >
                        OBI
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={(theme) => ({
                            color: theme.palette.text.secondary,
                            letterSpacing: '0.08em',
                        })}
                    >
                        Local Intelligence
                    </Typography>
                </Box>
            </Box>

            {/* New Chat Button */}
            <Box sx={{ px: 2, mb: 3.25 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onNewChat}
                    startIcon={<Icon>add_2</Icon>}
                    sx={(theme) => ({
                        justifyContent: 'center',
                        minHeight: 42,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        },
                    })}
                >
                    New Chat
                </Button>
            </Box>

            {/* Primary nav */}
            <Box sx={{ flex: 1 }}>
                <NavItem
                    icon="home"
                    label="Home"
                    active={activeItem === 'home'}
                    onClick={() => onSelect('home')}
                />
                <NavItem
                    icon="chat_bubble"
                    label="Chat"
                    active={activeItem === 'chat'}
                    onClick={() => onSelect('chat')}
                />
                <NavItem
                    icon="folder_open"
                    label="Files"
                    active={activeItem === 'files'}
                    onClick={() => onSelect('files')}
                />
                <NavItem
                    icon="hub"
                    label="Vault / Apps"
                    active={activeItem === 'vault'}
                    onClick={() => onSelect('vault')}
                />
                <NavItem
                    icon="history"
                    label="History"
                    active={activeItem === 'history'}
                    onClick={() => onSelect('history')}
                />
            </Box>

            {/* Footer nav */}
            <Box sx={{ mt: 'auto' }}>
                <NavItem
                    icon="settings"
                    label="Settings"
                    active={activeItem === 'settings'}
                    onClick={() => onSelect('settings')}
                />
                <NavItem
                    icon="shield"
                    label="Privacy"
                    active={activeItem === 'about'}
                    onClick={() => onSelect('about')}
                />
                <ThemeToggleButton
                    mode={selectedTheme}
                    onToggle={onThemeChange}
                />
            </Box>
        </Box>
    );
}

export default SidebarNav;
