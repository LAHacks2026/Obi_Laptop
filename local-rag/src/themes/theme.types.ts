declare module '@mui/material/styles' {
    interface Palette {
        surface: {
            base: string;
            low: string;
            mid: string;
            high: string;
            highest: string;
            lowest: string;
            bright: string;
            tint: string;
            inverse: string;
        };
        textTertiary: string;
        outline: {
            main: string;
            variant: string;
        };
        status: {
            errorDim: string;
            errorContainer: string;
            onErrorContainer: string;

            successDim: string;
            successContainer: string;
            onSuccessContainer: string;

            warningDim: string;
            warningContainer: string;
            onWarningContainer: string;
        };
    }

    interface PaletteOptions {
        surface?: {
            base: string;
            low: string;
            mid: string;
            high: string;
            highest: string;
            lowest: string;
            bright: string;
            tint: string;
            inverse: string;
        };
        textTertiary?: string;
        outline?: {
            main: string;
            variant: string;
        };
        status?: {
            errorDim: string;
            errorContainer: string;
            onErrorContainer: string;

            successDim: string;
            successContainer: string;
            onSuccessContainer: string;

            warningDim: string;
            warningContainer: string;
            onWarningContainer: string;
        };
    }
}
