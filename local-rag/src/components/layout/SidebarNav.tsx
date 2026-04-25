import { Box, Button, Typography, Icon } from '@mui/material';
import ThemeToggleButton from '../ui/ThemeToggleButton';

type NavKey = 'chat' | 'files' | 'vault' | 'history' | 'storage' | 'help';

type NavItemProps = {
    icon: React.ReactNode;
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
                gap: 1.5,
                px: 2,
                py: 1.25,
                mx: 1,
                borderRadius: 1,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 180ms ease',
                color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: active ? theme.palette.surface.high : 'transparent',
                borderLeft: active
                    ? `2px solid ${theme.palette.primary.main}`
                    : '2px solid transparent',
                '&:hover': {
                    backgroundColor: active
                        ? theme.palette.surface.highest
                        : theme.palette.surface.mid,
                    color: active
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                },
            })}
        >
            <Box sx={{ color: 'inherit', display: 'flex' }}>
                {icon}
            </Box>

            <Typography
                variant="overline"
                sx={{
                    letterSpacing: '0.16em',
                    lineHeight: 1.2,
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
                pt: 3,
            }}
        >
            {/* Brand */}
            <Box
                sx={{
                    px: 3,
                    mb: 4,
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

            {/* New Chat Button: CTA (Call to Action) */}
            <Box sx={{ px: 2, mb: 4 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onNewChat}
                    startIcon={<Icon>add_2</Icon>}
                    sx={(theme) => ({
                        justifyContent: 'center',
                        minHeight: 40,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                    })}
                >
                    New Chat
                </Button>
            </Box>

            {/* Primary nav */}
            <Box sx={{ flex: 1 }}>
                <NavItem
                    icon={<Icon>chat_bubble</Icon>}
                    label="Chat"
                    active={activeItem === 'chat'}
                    onClick={() => onSelect('chat')}
                />
                <NavItem
                    icon={<Icon>folder_open</Icon>}
                    label="Files"
                    active={activeItem === 'files'}
                    onClick={() => onSelect('files')}
                />
                <NavItem
                    icon={<Icon>database</Icon>}
                    label="Vault"
                    active={activeItem === 'vault'}
                    onClick={() => onSelect('vault')}
                />
                <NavItem
                    icon={<Icon>history</Icon>}
                    label="History"
                    active={activeItem === 'history'}
                    onClick={() => onSelect('history')}
                />
            </Box>

            {/* Footer nav */}
            <Box sx={{ mt: 'auto' }}>
                <NavItem
                    icon={<Icon>hard_drive</Icon>}
                    label="Storage"
                    active={activeItem === 'storage'}
                    onClick={() => onSelect('storage')}
                />
                <NavItem
                    icon={<Icon>help</Icon>}
                    label="Help"
                    active={activeItem === 'help'}
                    onClick={() => onSelect('help')}
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