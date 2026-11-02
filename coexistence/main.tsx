import {
    Button as MuiButton,
    CssBaseline,
    ThemeProvider,
    Typography as MuiTypography,
    createTheme,
} from '@mui/material';
import {
    Badge,
    BadgeAnchor,
    Button,
    Chip,
    HorizonProvider,
    Typography,
} from '@cialdnb/horizon-ui';
import bootstrapFull from 'bootstrap/dist/css/bootstrap.css?raw';
import bootstrapReboot from 'bootstrap/dist/css/bootstrap-reboot.css?raw';
import hzStyles from '@cialdnb/horizon-ui/styles.css?raw';
import hzUnlayeredStyles from '@cialdnb/horizon-ui/styles.unlayered.css?raw';
import { useEffect, useRef, useState } from 'react';
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
// Bootstrap) and that universal rule, both unlayered. ?reboot=full loads the
// full bootstrap.css instead (what customer360 imports: the reboot plus the
// `h1..h6 { font-weight: 500; line-height: 1.2; font-size }` type rules).
const reboot = () => {
    addStyle(
        'bootstrap-reboot',
        params.get('reboot') === 'full' ? bootstrapFull : bootstrapReboot
    );
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
const withReboot = ['1', 'full'].includes(params.get('reboot') ?? '');
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

/**
 * A clickable chip inside a clickable row, counting clicks on the chip, the
 * row's React handler and a native listener on the row (data attributes).
 */
function ChipInRow() {
    const [chip, setChip] = useState(0);
    const [row, setRow] = useState(0);
    const [native, setNative] = useState(0);
    const rowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const count = () => setNative((n) => n + 1);
        el.addEventListener('click', count);
        return () => el.removeEventListener('click', count);
    }, []);
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- harness fixture: a clickable row
        <div
            ref={rowRef}
            data-testid="hz-chip-row"
            data-chip-clicks={chip}
            data-row-clicks={row}
            data-native-clicks={native}
            style={{ paddingBlock: 32 }}
            onClick={() => setRow((n) => n + 1)}
        >
            <Chip
                label="row chip"
                onClick={() => setChip((n) => n + 1)}
                data-testid="hz-chip-in-row"
            />
        </div>
    );
}

const CHIP_TONES = [
    'neutral',
    'primary',
    'info',
    'success',
    'warning',
    'error',
] as const;

const TYPOGRAPHY_ROLES = [
    'display/xl',
    'display/lg',
    'heading/xl',
    'heading/lg',
    'heading/md',
    'heading/sm',
    'body/lg',
    'body/default',
    'body/secondary',
    'caption',
    'micro',
    'label/sm',
    'label/md',
    'label/lg',
] as const;

function App() {
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <main style={{ padding: 16 }}>
                <section data-testid="mui">
                    <MuiTypography variant="h5" data-testid="mui-typography">
                        MUI section
                    </MuiTypography>
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
                <section data-testid="hz-components">
                    <HorizonProvider>
                        {TYPOGRAPHY_ROLES.map((variant) => (
                            <Typography
                                key={variant}
                                variant={variant}
                                data-testid={`hz-typo-${variant}`}
                            >
                                {variant}
                            </Typography>
                        ))}
                        <Typography
                            variant="body/default"
                            weight="semibold"
                            as="h5"
                            data-testid="hz-typo-h5"
                        >
                            h5 element
                        </Typography>
                        <Typography
                            variant="body/secondary"
                            as="h6"
                            data-testid="hz-typo-h6"
                        >
                            h6 element
                        </Typography>
                        {CHIP_TONES.map((variant) => (
                            <Chip
                                key={variant}
                                variant={variant}
                                label={variant}
                                data-testid={`hz-chip-${variant}`}
                            />
                        ))}
                        <Chip
                            appearance="outline"
                            variant="success"
                            size="sm"
                            label="outline sm"
                            data-testid="hz-chip-outline"
                        />
                        <Chip
                            label="action"
                            onClick={() => undefined}
                            onDelete={() => undefined}
                            data-testid="hz-chip-action"
                        />
                        <Chip
                            label="disabled"
                            disabled
                            onClick={() => undefined}
                            data-testid="hz-chip-disabled"
                        />
                        <ChipInRow />
                        <Badge variant="success" data-testid="hz-badge-label">
                            Approved
                        </Badge>
                        <Badge
                            variant="error"
                            count={12}
                            data-testid="hz-badge-count"
                        />
                        <Badge
                            variant="warning"
                            aria-label="Pending"
                            data-testid="hz-badge-dot"
                        />
                        <Badge variant="ai" data-testid="hz-badge-ai">
                            AI summary
                        </Badge>
                        <Badge
                            variant="ai-verified"
                            data-testid="hz-badge-ai-verified"
                        >
                            AI verified
                        </Badge>
                        <BadgeAnchor
                            data-testid="hz-badge-anchor"
                            badge={
                                <Badge
                                    variant="error"
                                    count={4}
                                    aria-label="4 unread"
                                    data-testid="hz-badge-anchored"
                                />
                            }
                        >
                            <Button variant="ghost">Inbox</Button>
                        </BadgeAnchor>
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
