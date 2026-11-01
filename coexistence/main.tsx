import {
    Button as MuiButton,
    CssBaseline,
    ThemeProvider,
    Typography,
    createTheme,
} from '@mui/material';
import { Button, HorizonProvider } from '@cialdnb/horizon-ui';
import hzStyles from '@cialdnb/horizon-ui/styles.css?raw';
import { createRoot } from 'react-dom/client';

// ?styles=0 renders the page without horizon-ui's stylesheet (baseline).
if (new URLSearchParams(location.search).get('styles') !== '0') {
    const style = document.createElement('style');
    style.id = 'hz-styles';
    style.textContent = hzStyles;
    document.head.append(style);
}

// Mirrors x-core Legacy: htmlFontSize 14, Open Sans, primary #0050F0.
const muiTheme = createTheme({
    typography: {
        htmlFontSize: 14,
        fontSize: 14,
        fontFamily: 'Open Sans, sans-serif',
    },
    palette: { primary: { main: '#0050F0' } },
});

function App() {
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <main style={{ padding: 16 }}>
                <section data-testid="mui">
                    <Typography variant="h5" data-testid="mui-typography">
                        MUI section
                    </Typography>
                    <MuiButton variant="contained" data-testid="mui-button">
                        MUI button
                    </MuiButton>
                </section>
                <section data-testid="horizon">
                    <HorizonProvider>
                        <Button data-testid="hz-button">Horizon button</Button>
                        <Button loading data-testid="hz-ltr-loading">
                            Horizon ltr loading
                        </Button>
                        <div
                            data-testid="hz-bp-probe"
                            className="hz:text-micro hz:tablet:text-caption hz:laptop:text-body-default hz:desktop:text-heading-xl"
                        >
                            Breakpoint probe
                        </div>
                    </HorizonProvider>
                </section>
                <section data-testid="hz-rtl-section" dir="rtl">
                    <HorizonProvider dir="rtl">
                        <Button loading data-testid="hz-rtl-loading">
                            Horizon rtl loading
                        </Button>
                    </HorizonProvider>
                </section>
            </main>
        </ThemeProvider>
    );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
