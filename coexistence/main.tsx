import {
    Button as MuiButton,
    CssBaseline,
    ThemeProvider,
    Typography,
    createTheme,
} from '@mui/material';
import { Button, HorizonProvider } from '@cialdnb/horizon-ui';
import bootstrapReboot from 'bootstrap/dist/css/bootstrap-reboot.css?raw';
import hzStyles from '@cialdnb/horizon-ui/styles.css?raw';
import hzUnlayeredStyles from '@cialdnb/horizon-ui/styles.unlayered.css?raw';
import { createRoot } from 'react-dom/client';

function addStyle(id: string, css: string) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.append(style);
}

const params = new URLSearchParams(location.search);
// customer360 ships Bootstrap 4.4.1 UNLAYERED plus `* { box-sizing: border-box }`.
// ?reboot=1 loads the real bootstrap-reboot.css (the global element rules of
// Bootstrap) and that universal rule, both unlayered.
const reboot = () => {
    addStyle('bootstrap-reboot', bootstrapReboot);
    addStyle('c360-global', '* { box-sizing: border-box; }');
};
// ?build=unlayered loads dist/styles.unlayered.css instead of dist/styles.css.
const horizon = () =>
    addStyle(
        'hz-styles',
        params.get('build') === 'unlayered' ? hzUnlayeredStyles : hzStyles
    );
// ?styles=0 renders the page without horizon-ui's stylesheet (baseline).
// ?order=horizon-first puts horizon's CSS before the reboot; the default is
// legacy CSS first, the order the docs recommend.
const withReboot = params.get('reboot') === '1';
const withHorizon = params.get('styles') !== '0';
if (params.get('order') === 'horizon-first') {
    if (withHorizon) horizon();
    if (withReboot) reboot();
} else {
    if (withReboot) reboot();
    if (withHorizon) horizon();
}

// Mirrors x-core Legacy: MUI htmlFontSize 14 against the browser-default 16px
// root, as in customer360 (it sets no html font-size). Tests also stress 14px.
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
                <section data-testid="plain">
                    <h1>Plain h1</h1>
                    <p>Plain p</p>
                    <a href="#plain">Plain a</a>
                    <ul>
                        <li>Plain li</li>
                    </ul>
                    <button type="button">Plain button</button>
                    <input aria-label="Plain input" />
                    <table>
                        <tbody>
                            <tr>
                                <td>Plain td</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                <section data-testid="horizon">
                    <HorizonProvider>
                        {(
                            [
                                'primary',
                                'secondary',
                                'tertiary',
                                'destructive',
                                'ghost',
                                'link',
                            ] as const
                        ).map((variant) => (
                            <Button
                                key={variant}
                                variant={variant}
                                data-testid={`hz-variant-${variant}`}
                            >
                                {variant}
                            </Button>
                        ))}
                        {(
                            [
                                'primary',
                                'secondary',
                                'tertiary',
                                'destructive',
                                'ghost',
                                'link',
                            ] as const
                        ).map((variant) => (
                            <Button
                                key={variant}
                                asChild
                                variant={variant}
                                data-testid={`hz-link-${variant}`}
                            >
                                <a href="#reports">{variant} link</a>
                            </Button>
                        ))}
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
                <section data-testid="hz-rtl-section">
                    <HorizonProvider dir="rtl">
                        <Button loading data-testid="hz-rtl-loading">
                            Horizon rtl loading
                        </Button>
                    </HorizonProvider>
                </section>
                <section data-testid="rtl-area" dir="rtl">
                    <MuiButton data-testid="mui-in-rtl">
                        MUI in rtl area
                    </MuiButton>
                    <HorizonProvider dir="ltr">
                        <Button loading data-testid="hz-ltr-in-rtl">
                            Horizon ltr in rtl
                        </Button>
                    </HorizonProvider>
                </section>
            </main>
        </ThemeProvider>
    );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
