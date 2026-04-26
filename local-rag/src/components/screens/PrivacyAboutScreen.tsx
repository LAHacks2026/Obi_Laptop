import { Box, Divider, Icon, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

const FEATURES = [
    {
        icon: 'computer',
        title: 'Runs locally on your device',
        description:
            'Obi runs entirely on your machine. Your files are never uploaded to a cloud service unless you explicitly connect one.',
    },
    {
        icon: 'search',
        title: 'Semantic file search',
        description:
            'Find what you\'re looking for using natural language. Obi understands context, not just keywords.',
    },
    {
        icon: 'hub',
        title: 'Connect your apps',
        description:
            'Obi supports local files today, with Gmail, Notion, Slack, and GitHub coming soon. You choose what to connect.',
    },
    {
        icon: 'shield',
        title: 'Privacy by design',
        description:
            'No telemetry, no cloud sync, no tracking. Obi is built from the ground up to respect your privacy.',
    },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Index your files', body: 'Pick a folder. Obi scans your files, creates embeddings locally, and stores them in a vector database on your device.' },
    { step: '02', title: 'Ask anything', body: 'Type a question or query in natural language. Obi finds the most relevant content from your files.' },
    { step: '03', title: 'Get answers with sources', body: 'The local AI model reads your retrieved files and generates a grounded answer, showing you exactly where the information came from.' },
];

export default function PrivacyAboutScreen() {
    const theme = useTheme();

    return (
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <Box sx={{ px: 4, py: 5, maxWidth: 720, mx: 'auto' }}>
                {/* Hero */}
                <Box sx={{ mb: 5, textAlign: 'center' }}>
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2.5,
                        }}
                    >
                        <Icon sx={{ fontSize: 28, color: theme.palette.primary.contrastText }}>tokens</Icon>
                    </Box>

                    <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{ letterSpacing: '-0.025em', mb: 1.5 }}
                    >
                        What is Obi?
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: '1.05rem',
                            color: theme.palette.text.secondary,
                            lineHeight: 1.75,
                            maxWidth: 540,
                            mx: 'auto',
                        }}
                    >
                        Obi is your{' '}
                        <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                            local intelligence layer
                        </Box>
                        . It helps you search and understand your files without constantly uploading your private data.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Features */}
                <Box sx={{ mb: 5 }}>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: theme.palette.text.secondary,
                            mb: 2.5,
                        }}
                    >
                        What Obi does
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                        }}
                    >
                        {FEATURES.map((f) => (
                            <Box
                                key={f.title}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.outline.variant}`,
                                    backgroundColor: theme.palette.surface.mid,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 1.5,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 1.5,
                                    }}
                                >
                                    <Icon sx={{ fontSize: 20, color: theme.palette.primary.main }}>{f.icon}</Icon>
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 0.5 }}>
                                    {f.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, lineHeight: 1.65 }}>
                                    {f.description}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* How it works */}
                <Box sx={{ mb: 5 }}>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: theme.palette.text.secondary,
                            mb: 2.5,
                        }}
                    >
                        How it works
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {HOW_IT_WORKS.map((step, i) => (
                            <Box
                                key={step.step}
                                sx={{
                                    display: 'flex',
                                    gap: 2.5,
                                    position: 'relative',
                                    pb: i < HOW_IT_WORKS.length - 1 ? 0 : 0,
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            zIndex: 1,
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: theme.palette.primary.main, letterSpacing: '-0.02em' }}>
                                            {step.step}
                                        </Typography>
                                    </Box>
                                    {i < HOW_IT_WORKS.length - 1 && (
                                        <Box
                                            sx={{
                                                width: 1,
                                                flex: 1,
                                                minHeight: 24,
                                                backgroundColor: theme.palette.outline.variant,
                                                my: 0.5,
                                            }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ pb: i < HOW_IT_WORKS.length - 1 ? 2.5 : 0, pt: 0.5 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>
                                        {step.title}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary, lineHeight: 1.65 }}>
                                        {step.body}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Privacy commitments */}
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Icon sx={{ color: theme.palette.primary.main, fontSize: 20 }}>shield</Icon>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            Our privacy commitments
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {[
                            'Your files never leave your device unless you explicitly connect a cloud app.',
                            'Obi does not collect, sell, or share your data.',
                            'You control exactly which folders and apps Obi can access.',
                            'You can delete your entire index at any time from Settings.',
                            'The AI model runs entirely on your local hardware.',
                        ].map((item) => (
                            <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                <Icon sx={{ fontSize: 16, color: '#4CAF50', mt: 0.2, flexShrink: 0 }}>check_circle</Icon>
                                <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.6, color: theme.palette.text.primary }}>
                                    {item}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
