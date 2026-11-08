import { expect, test, type Page } from '@playwright/test';
import { diffStates, LINK_STATES, linkStates } from './linkStates';

/*
 * Batch 1 components (Typography, Chip, Badge, Spinner, ...) against customer360's
 * unlayered Bootstrap 4.4.1: `?reboot=1` is bootstrap-reboot.css, `?reboot=full`
 * the full bootstrap.css customer360 imports (adds `h1..h6 { font-weight: 500;
 * line-height: 1.2; font-size }`). Each probe is measured without Bootstrap
 * and with it, in both load orders, for both CSS builds.
 */

const TYPE_PROPS = [
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'paddingTop',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textTransform',
    'color',
    'display',
] as const;

const TYPOGRAPHY = [
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
    'h5',
    'h6',
].map((v) => `hz-typo-${v}`);

/**
 * A measured element: `key` names it in results, `selector` finds it, and
 * `focus` (a selector) is keyboard-focused first so `:focus` and
 * `:focus-visible` rules (Bootstrap `button:focus`) are in play.
 */
type Target = { key: string; selector: string; focus?: string };
/** A group of targets measured with one property list. */
type Probe = { targets: readonly Target[]; props: readonly string[] };

const byTestId = (id: string) => `[data-testid="${id}"]`;
const plain = (ids: readonly string[]): Target[] =>
    ids.map((id) => ({ key: id, selector: byTestId(id) }));

const CHIP_PROPS = [
    'height',
    'width',
    'paddingInlineStart',
    'paddingInlineEnd',
    'marginTop',
    'borderRadius',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'textTransform',
    'color',
    'backgroundColor',
    'boxShadow',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
    'verticalAlign',
] as const;

const CHIP: Target[] = [
    ...plain(
        [
            'neutral',
            'primary',
            'info',
            'success',
            'warning',
            'error',
            'outline',
            'disabled',
        ].map((v) => `hz-chip-${v}`)
    ),
    { key: 'action chip', selector: byTestId('hz-chip-action') },
    {
        key: 'action chip, action focused',
        selector: byTestId('hz-chip-action'),
        focus: `${byTestId('hz-chip-action')} [data-chip-action]`,
    },
    {
        key: 'action button, focused',
        selector: `${byTestId('hz-chip-action')} [data-chip-action]`,
        focus: `${byTestId('hz-chip-action')} [data-chip-action]`,
    },
    {
        key: 'remove button',
        selector: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
    },
    {
        key: 'remove button, focused',
        selector: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
        focus: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
    },
    {
        key: 'disabled action button',
        selector: `${byTestId('hz-chip-disabled')} button`,
    },
];

const BADGE_PROPS = [
    ...CHIP_PROPS,
    'position',
    'top',
    'insetInlineEnd',
    'transform',
] as const;

const BADGE: Target[] = [
    ...plain(
        [
            'label',
            'count',
            'dot',
            'ai',
            'ai-verified',
            'anchor',
            'anchored',
        ].map((v) => `hz-badge-${v}`)
    ),
    {
        key: 'label text',
        selector: `${byTestId('hz-badge-label')} > span:last-child`,
    },
    {
        key: 'anchored slot',
        selector: `${byTestId('hz-badge-anchor')} [data-badge-slot]`,
    },
];

const SPINNER_PROPS = [
    'width',
    'height',
    'borderTopWidth',
    'borderTopColor',
    'borderInlineEndColor',
    'borderRadius',
    'boxSizing',
    'color',
    'display',
    'verticalAlign',
    'overflow',
    'stroke',
    'strokeWidth',
    'animationName',
    'animationDuration',
    'animationIterationCount',
] as const;

const SPINNER: Target[] = [
    ...plain(['sm', 'xl', 'ring'].map((v) => `hz-spinner-${v}`)),
    // Bootstrap reboot styles `svg { overflow: hidden; vertical-align: middle }`.
    { key: 'ring svg', selector: `${byTestId('hz-spinner-ring')} svg` },
    {
        key: 'ring arc',
        selector: `${byTestId('hz-spinner-ring')} [data-spinner-arc]`,
    },
];

const SEPARATOR_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'borderTopWidth',
    'borderTopStyle',
    'backgroundColor',
    'boxSizing',
    'overflow',
    'opacity',
    'display',
    'alignSelf',
] as const;

const PROGRESS_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'borderRadius',
    'overflow',
    'backgroundColor',
    'color',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'translate',
    'transitionDuration',
    'animationName',
    'display',
] as const;

const progressPart = (id: string, part: string) => `${byTestId(id)} ${part}`;
const PROGRESS: Target[] = [
    ...plain(['hz-progress', 'hz-progress-indeterminate']),
    {
        key: 'track',
        selector: progressPart('hz-progress', '[role="progressbar"]'),
    },
    {
        key: 'indicator',
        selector: progressPart('hz-progress', '[data-progress-indicator]'),
    },
    {
        key: 'label',
        selector: progressPart('hz-progress', 'span[id]'),
    },
    {
        key: 'value',
        selector: progressPart('hz-progress', '[data-progress-value]'),
    },
    {
        key: 'segment',
        selector: progressPart(
            'hz-progress-indeterminate',
            '[data-progress-indicator]'
        ),
    },
];

const ALERT_PROPS = [
    'width',
    'height',
    'paddingTop',
    'paddingInlineStart',
    'marginTop',
    'marginInlineEnd',
    'borderRadius',
    'borderTopWidth',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'backgroundColor',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
] as const;

const alertPart = (part: string) => `${byTestId('hz-alert')} ${part}`;
const ALERT: Target[] = [
    ...plain(['hz-alert', 'hz-alert-plain']),
    { key: 'icon', selector: alertPart('[data-alert-icon] svg') },
    { key: 'title', selector: alertPart('[data-alert-title]') },
    { key: 'description', selector: alertPart('[data-alert-description]') },
    { key: 'action', selector: alertPart('[data-alert-action] button') },
    { key: 'dismiss', selector: alertPart('button[aria-label="Dismiss"]') },
    {
        key: 'dismiss, focused',
        selector: alertPart('button[aria-label="Dismiss"]'),
        focus: alertPart('button[aria-label="Dismiss"]'),
    },
];

const AVATAR_PROPS = [
    'width',
    'height',
    'marginInlineStart',
    'borderRadius',
    'borderTopStyle',
    'borderTopWidth',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'backgroundColor',
    'boxShadow',
    'objectFit',
    'opacity',
    'position',
    'overflow',
    'display',
    'verticalAlign',
] as const;

const AVATAR: Target[] = [
    ...plain(['sm', 'xl', 'photo', 'group'].map((v) => `hz-avatar-${v}`)),
    // Bootstrap reboot styles `img { vertical-align: middle; border-style: none }`.
    { key: 'photo img', selector: `${byTestId('hz-avatar-photo')} img` },
    {
        key: 'group second',
        selector: `${byTestId('hz-avatar-group')} > :nth-child(2)`,
    },
    {
        key: 'group overflow',
        selector: `${byTestId('hz-avatar-group')} > :last-child`,
    },
];

const ICON_BUTTON_PROPS = [
    'width',
    'height',
    'paddingTop',
    'paddingInlineStart',
    'marginTop',
    'borderRadius',
    'borderTopWidth',
    'borderTopColor',
    'color',
    'backgroundColor',
    'fontSize',
    'lineHeight',
    'textDecorationLine',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
    'verticalAlign',
] as const;

const ICON_BUTTON_VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
] as const;

const ICON_BUTTON: Target[] = [
    ...plain(
        [...ICON_BUTTON_VARIANTS, 'disabled', 'loading'].map(
            (v) => `hz-iconbutton-${v}`
        )
    ),
    ...plain(ICON_BUTTON_VARIANTS.map((v) => `hz-iconlink-${v}`)),
    {
        key: 'primary, focused',
        selector: byTestId('hz-iconbutton-primary'),
        focus: byTestId('hz-iconbutton-primary'),
    },
    {
        key: 'link, focused',
        selector: byTestId('hz-iconlink-ghost'),
        focus: byTestId('hz-iconlink-ghost'),
    },
    {
        key: 'icon svg',
        selector: `${byTestId('hz-iconbutton-primary')} svg`,
    },
];

const LINK_IDS = ['inline', 'standalone', 'subtle', 'external', 'disabled'].map(
    (v) => `hz-anchor-${v}`
);

const LINK_PROBE_PROPS = [
    'width',
    'height',
    'minHeight',
    'color',
    'backgroundColor',
    'textDecorationLine',
    'textDecorationThickness',
    'textUnderlineOffset',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'borderRadius',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
] as const;

const LINK: Target[] = [
    ...plain(LINK_IDS),
    {
        key: 'standalone, focused',
        selector: byTestId('hz-anchor-standalone'),
        focus: byTestId('hz-anchor-standalone'),
    },
    {
        key: 'external icon',
        selector: `${byTestId('hz-anchor-external')} svg`,
    },
];

/* ---- Forms (Task 11a) ---- */

const FORM_TYPE_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'paddingTop',
    'paddingInlineStart',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'cursor',
    'display',
] as const;

const LABEL: Target[] = [
    ...plain(['hz-label', 'hz-label-disabled']),
    { key: 'required mark', selector: `${byTestId('hz-label')} span` },
];

const FIELD_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'marginInlineEnd',
    'paddingTop',
    'paddingInlineStart',
    'paddingInlineEnd',
    'borderTopWidth',
    'borderTopStyle',
    'borderRadius',
    'boxShadow',
    'boxSizing',
    'backgroundColor',
    'color',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'appearance',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'overflow',
    'resize',
    'cursor',
    'display',
    'verticalAlign',
] as const;

const fieldOf = (id: string) => `[data-input-field]:has(> ${byTestId(id)})`;
const comboboxField = (id: string) =>
    `[data-combobox-field]:has(> ${byTestId(id)})`;
const INPUT_IDS = ['', '-sm', '-lg', '-invalid', '-disabled', '-number'].map(
    (v) => `hz-input${v}`
);
const INPUT: Target[] = [
    ...plain(INPUT_IDS),
    ...INPUT_IDS.map((id) => ({ key: `${id} field`, selector: fieldOf(id) })),
    {
        key: 'field, input focused',
        selector: fieldOf('hz-input'),
        focus: byTestId('hz-input'),
    },
    { key: 'search input', selector: byTestId('hz-input-search') },
    { key: 'search field', selector: fieldOf('hz-input-search') },
    {
        key: 'clear button',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
    },
    {
        key: 'clear button, focused',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
        focus: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
    },
    {
        key: 'adornment IconButton (button + button)',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Go"]`,
    },
];

/** The legacy-host stylesheets every probe is measured against. */
const LEGACY_CSS: readonly { label: string; opts: Opts }[] = [
    { label: 'bootstrap-reboot.css', opts: { reboot: '1' } },
    { label: 'full bootstrap.css', opts: { reboot: 'full' } },
    {
        label: 'full bootstrap.css + customer360 host CSS',
        opts: { reboot: 'full', host: true },
    },
];

const BUTTON_VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
    'link',
] as const;

// Buttons are siblings in the harness: customer360's `button + button {
// margin-left: 8px }` applies to every Button after the first.
const BUTTON: Target[] = [
    ...plain(BUTTON_VARIANTS.map((v) => `hz-variant-${v}`)),
    ...plain(BUTTON_VARIANTS.map((v) => `hz-link-${v}`)),
    {
        key: 'secondary, focused',
        selector: byTestId('hz-variant-secondary'),
        focus: byTestId('hz-variant-secondary'),
    },
];

const PROBES: Record<string, Probe> = {
    Button: {
        targets: BUTTON,
        props: [
            ...ICON_BUTTON_PROPS,
            'marginInlineStart',
            'fontFamily',
            'fontWeight',
        ],
    },
    Typography: { targets: plain(TYPOGRAPHY), props: TYPE_PROPS },
    Chip: { targets: CHIP, props: CHIP_PROPS },
    Badge: { targets: BADGE, props: BADGE_PROPS },
    Spinner: { targets: SPINNER, props: SPINNER_PROPS },
    Separator: {
        targets: plain(['hz-separator-h', 'hz-separator-v']),
        props: SEPARATOR_PROPS,
    },
    Progress: { targets: PROGRESS, props: PROGRESS_PROPS },
    Alert: { targets: ALERT, props: ALERT_PROPS },
    Avatar: { targets: AVATAR, props: AVATAR_PROPS },
    IconButton: { targets: ICON_BUTTON, props: ICON_BUTTON_PROPS },
    Link: { targets: LINK, props: LINK_PROBE_PROPS },
    Label: { targets: LABEL, props: FORM_TYPE_PROPS },
    Input: { targets: INPUT, props: FIELD_PROPS },
    FormField: {
        targets: [
            { key: 'field', selector: byTestId('hz-formfield') },
            { key: 'label', selector: `${byTestId('hz-formfield')} > label` },
            {
                key: 'description',
                selector: `${byTestId('hz-formfield')} > p:not([role])`,
            },
            {
                key: 'error',
                selector: `${byTestId('hz-formfield')} > p[role="alert"]`,
            },
            {
                key: 'error icon',
                selector: `${byTestId('hz-formfield')} > p[role="alert"] svg`,
            },
        ],
        props: [...FORM_TYPE_PROPS, 'rowGap', 'verticalAlign'],
    },
    Checkbox: {
        targets: [
            ...plain(
                ['', '-checked', '-mixed', '-disabled'].map(
                    (v) => `hz-checkbox${v}`
                )
            ),
            ...['', '-checked', '-mixed'].map((v) => ({
                key: `hz-checkbox${v} box`,
                selector: `${byTestId(`hz-checkbox${v}`)} > span`,
            })),
            {
                key: 'box, focused',
                selector: `${byTestId('hz-checkbox')} > span`,
                focus: byTestId('hz-checkbox'),
            },
            {
                key: 'check icon',
                selector: `${byTestId('hz-checkbox-checked')} svg[data-checkbox-icon="checked"]`,
            },
            {
                key: 'label',
                selector: `[data-checkbox]:has(> ${byTestId('hz-checkbox')}) > label`,
            },
            {
                key: 'disabled label',
                selector: `[data-checkbox]:has(> ${byTestId('hz-checkbox-disabled')}) > label`,
            },
            {
                key: 'wrapper',
                selector: `[data-checkbox]:has(> ${byTestId('hz-checkbox')})`,
            },
        ],
        props: FIELD_PROPS,
    },
    RadioGroup: {
        targets: [
            { key: 'group', selector: byTestId('hz-radiogroup') },
            ...plain(['', '-checked', '-disabled'].map((v) => `hz-radio${v}`)),
            ...['', '-checked', '-disabled'].map((v) => ({
                key: `hz-radio${v} circle`,
                selector: `${byTestId(`hz-radio${v}`)} > span`,
            })),
            {
                key: 'dot',
                selector: `${byTestId('hz-radio-checked')} > span > span`,
            },
            {
                key: 'circle, focused',
                selector: `${byTestId('hz-radio-checked')} > span`,
                focus: byTestId('hz-radio-checked'),
            },
            {
                key: 'label',
                selector: `[data-radio]:has(> ${byTestId('hz-radio')}) > label`,
            },
        ],
        props: FIELD_PROPS,
    },
    Switch: {
        targets: [
            ...plain(['hz-switch', 'hz-switch-on']),
            ...['', '-on'].map((v) => ({
                key: `hz-switch${v} track`,
                selector: `${byTestId(`hz-switch${v}`)} > span`,
            })),
            ...['', '-on'].map((v) => ({
                key: `hz-switch${v} thumb`,
                selector: `${byTestId(`hz-switch${v}`)} [data-switch-thumb]`,
            })),
            {
                key: 'track, focused',
                selector: `${byTestId('hz-switch')} > span`,
                focus: byTestId('hz-switch'),
            },
            {
                key: 'label',
                selector: `[data-switch]:has(> ${byTestId('hz-switch')}) > label`,
            },
        ],
        props: [...FIELD_PROPS, 'translate', 'transform'],
    },
    Select: {
        targets: [
            ...plain(['hz-select', 'hz-select-value']),
            {
                key: 'trigger, focused',
                selector: byTestId('hz-select'),
                focus: byTestId('hz-select'),
            },
            {
                key: 'value text',
                selector: `${byTestId('hz-select-value')} > span`,
            },
            { key: 'chevron', selector: `${byTestId('hz-select')} > svg` },
            {
                key: 'clear button',
                selector: `[data-select-field]:has(${byTestId('hz-select-value')}) > button:not([role])`,
            },
        ],
        props: FIELD_PROPS,
    },
    Combobox: {
        targets: [
            ...plain(['hz-combobox', 'hz-combobox-value', 'hz-combobox-multi']),
            ...['hz-combobox', 'hz-combobox-value', 'hz-combobox-multi'].map(
                (id) => ({ key: `${id} field`, selector: comboboxField(id) })
            ),
            {
                key: 'field, input focused',
                selector: comboboxField('hz-combobox'),
                focus: byTestId('hz-combobox'),
            },
            {
                key: 'toggle button',
                selector: `${comboboxField('hz-combobox')} [data-combobox-toggle]`,
            },
            {
                key: 'clear button',
                selector: `${comboboxField('hz-combobox-value')} button[aria-label="Clear"]`,
            },
            {
                key: 'clear button, focused',
                selector: `${comboboxField('hz-combobox-value')} button[aria-label="Clear"]`,
                focus: `${comboboxField('hz-combobox-value')} button[aria-label="Clear"]`,
            },
            {
                key: 'chip remove button',
                selector: `${comboboxField('hz-combobox-multi')} button[aria-label="Remove Globex"]`,
            },
        ],
        props: FIELD_PROPS,
    },
    SearchBar: {
        targets: [
            ...plain(['hz-searchbar', 'hz-searchbar-loading']),
            { key: 'field', selector: fieldOf('hz-searchbar') },
            {
                key: 'field, focused',
                selector: fieldOf('hz-searchbar'),
                focus: byTestId('hz-searchbar'),
            },
            {
                key: 'search button',
                selector: `${fieldOf('hz-searchbar')} [data-search-button]`,
            },
            {
                key: 'search button, focused',
                selector: `${fieldOf('hz-searchbar')} [data-search-button]`,
                focus: `${fieldOf('hz-searchbar')} [data-search-button]`,
            },
            {
                key: 'clear button',
                selector: `${fieldOf('hz-searchbar')} button[aria-label="Clear"]`,
            },
            {
                key: 'landmark',
                selector: `[data-search-bar]:has(${byTestId('hz-searchbar')})`,
            },
        ],
        props: FIELD_PROPS,
    },
    Filter: {
        targets: [
            ...plain(['hz-filter', 'hz-filter-toggle']),
            {
                key: 'pill, focused',
                selector: byTestId('hz-filter'),
                focus: byTestId('hz-filter'),
            },
            {
                key: 'count bubble',
                selector: `${byTestId('hz-filter')} [data-filter-count]`,
            },
            {
                key: 'total bubble',
                selector: `${byTestId('hz-filter')} [data-filter-total]`,
            },
        ],
        props: FIELD_PROPS,
    },
    EmailsField: {
        targets: [
            ...plain(['hz-emails']),
            {
                key: 'field',
                selector: `[data-emails-field]:has(> ${byTestId('hz-emails')})`,
            },
            {
                key: 'field, focused',
                selector: `[data-emails-field]:has(> ${byTestId('hz-emails')})`,
                focus: byTestId('hz-emails'),
            },
            {
                key: 'chip remove button',
                selector: `[data-emails-field]:has(> ${byTestId('hz-emails')}) button[aria-label="Remove dana@example.com"]`,
            },
            {
                key: 'clear all',
                selector: `[data-emails-field]:has(> ${byTestId('hz-emails')}) button[aria-label="Clear all"]`,
            },
            {
                key: 'counter',
                selector: `[data-emails-field]:has(> ${byTestId('hz-emails')}) + div [data-emails-counter]`,
            },
        ],
        props: FIELD_PROPS,
    },
    NumberInput: {
        targets: [
            ...plain(['hz-number']),
            { key: 'field', selector: fieldOf('hz-number') },
            {
                key: 'field, focused',
                selector: fieldOf('hz-number'),
                focus: byTestId('hz-number'),
            },
            {
                key: 'decrease (button + button target)',
                selector: `${fieldOf('hz-number')} button[aria-label="Decrease"]`,
            },
            {
                key: 'increase',
                selector: `${fieldOf('hz-number')} button[aria-label="Increase"]`,
            },
        ],
        props: FIELD_PROPS,
    },
    // Two buttons in a row: customer360's `button + button { margin-left }`
    // must not split the pill.
    SplitButton: {
        targets: ['hz-split', 'hz-split-secondary'].flatMap((id) => [
            { key: `${id} group`, selector: byTestId(id) },
            {
                key: `${id} main`,
                selector: `${byTestId(id)} [data-split-main]`,
            },
            {
                key: `${id} menu`,
                selector: `${byTestId(id)} [data-split-menu]`,
            },
            {
                key: `${id} menu, focused`,
                selector: `${byTestId(id)} [data-split-menu]`,
                focus: `${byTestId(id)} [data-split-menu]`,
            },
        ]),
        props: [
            ...FIELD_PROPS,
            'borderInlineStartColor',
            'borderInlineStartWidth',
        ],
    },
    Textarea: {
        targets: [
            ...plain(
                ['', '-invalid', '-disabled'].map((v) => `hz-textarea${v}`)
            ),
            {
                key: 'focused',
                selector: byTestId('hz-textarea'),
                focus: byTestId('hz-textarea'),
            },
        ],
        props: FIELD_PROPS,
    },
};

type Styles = Record<string, Record<string, string>>;

type Opts = { reboot?: '1' | 'full'; horizonFirst?: boolean; host?: boolean };
const url = (build: 'layered' | 'unlayered', opts: Opts = {}) => {
    const q = new URLSearchParams();
    if (build === 'unlayered') q.set('build', 'unlayered');
    if (opts.reboot) q.set('reboot', opts.reboot);
    if (opts.horizonFirst) q.set('order', 'horizon-first');
    if (opts.host) q.set('host', 'customer360');
    return `/?${q.toString()}`;
};

const measure = async (page: Page, path: string, probe: Probe) => {
    await page.goto(path);
    await expect(
        page.locator(probe.targets[0]?.selector ?? 'missing')
    ).toBeVisible();
    const out: Styles = {};
    for (const target of probe.targets) {
        await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur()
        );
        if (target.focus) {
            // Keyboard modality first, so the element matches :focus-visible.
            await page.keyboard.press('Shift');
            await page.locator(target.focus).focus();
        }
        out[target.key] = await page.locator(target.selector).evaluate(
            async (el, props) => {
                // Read settled values, not a transition midpoint (infinite
                // animations, such as the Spinner's, never settle).
                await Promise.all(
                    el
                        .getAnimations()
                        .filter(
                            (a) => a.effect?.getTiming().iterations !== Infinity
                        )
                        .map((a) => a.finished.catch(() => undefined))
                );
                const cs = getComputedStyle(el);
                return Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
            },
            [...probe.props]
        );
    }
    return out;
};

/** `{ id: ['prop: before -> after'] }` for every probe whose styles changed. */
const diff = (a: Styles, b: Styles) =>
    Object.fromEntries(
        Object.keys(a)
            .map((id) => [
                id,
                Object.keys(a[id] ?? {})
                    .filter((p) => a[id]?.[p] !== b[id]?.[p])
                    .map((p) => `${p}: ${a[id]?.[p]} -> ${b[id]?.[p]}`),
            ])
            .filter(([, changed]) => (changed?.length ?? 0) > 0)
    );

for (const [name, probe] of Object.entries(PROBES)) {
    test.describe(`${name} against Bootstrap 4.4.1`, () => {
        test('unlayered build renders identically to the layered build', async ({
            page,
        }) => {
            const layered = await measure(page, url('layered'), probe);
            const unlayered = await measure(page, url('unlayered'), probe);
            expect(diff(layered, unlayered)).toEqual({});
        });

        for (const legacy of LEGACY_CSS)
            for (const horizonFirst of [false, true])
                test(`unlayered build is unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    const without = await measure(
                        page,
                        url('unlayered'),
                        probe
                    );
                    const withBootstrap = await measure(
                        page,
                        url('unlayered', { ...legacy.opts, horizonFirst }),
                        probe
                    );
                    expect(
                        await page.locator('#bootstrap-reboot').count()
                    ).toBe(1);
                    expect(await page.locator('#c360-host').count()).toBe(
                        legacy.opts.host ? 1 : 0
                    );
                    expect(diff(without, withBootstrap)).toEqual({});
                });
    });
}

// KNOWN LIMIT of the LAYERED build (ADR 0001): unlayered Bootstrap element
// rules beat every layered utility. Asserts the measured truth for
// styles.css; legacy hosts use styles.unlayered.css (groups above).
test.describe('layered build (known limit): full Bootstrap restyles Typography headings and paragraphs', () => {
    test('exactly the properties Bootstrap sets on h1..h6 and p change', async ({
        page,
    }) => {
        const probe = PROBES['Typography'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual(LAYERED_TYPOGRAPHY_DIFF);
    });
});

// Measured: margins from `h1..h6 { margin-bottom: .5rem }` / `p { margin: 0 0
// 1rem }` (display and body roles render <p>), and on headings `font-weight:
// 500; line-height: 1.2` plus Bootstrap's per-level font-size. Caption, micro
// and labels (span) are untouched. Colour and family survive (Bootstrap sets
// neither on headings).
const heading = (size: string | null, weight: string, line: string) => [
    'marginBottom: 0px -> 8px',
    ...(size ? [`fontSize: ${size}`] : []),
    `fontWeight: ${weight} -> 500`,
    `lineHeight: ${line}`,
];
const paragraph = ['marginBottom: 0px -> 16px'];
const LAYERED_TYPOGRAPHY_DIFF = {
    'hz-typo-display/xl': paragraph,
    'hz-typo-display/lg': paragraph,
    'hz-typo-heading/xl': heading('36px -> 40px', '700', '36px -> 48px'),
    'hz-typo-heading/lg': heading(null, '700', '32px -> 38.4px'),
    'hz-typo-heading/md': heading(null, '600', '28px -> 33.6px'),
    'hz-typo-heading/sm': heading(null, '700', '24px -> 28.8px'),
    'hz-typo-h5': heading('16px -> 20px', '600', '20px -> 24px'),
    'hz-typo-h6': heading('14px -> 16px', '400', '14px -> 19.2px'),
    'hz-typo-body/lg': paragraph,
    'hz-typo-body/default': paragraph,
    'hz-typo-body/secondary': paragraph,
};

test.describe('layered build (known limit): Bootstrap restyles the Chip buttons', () => {
    test('exactly the button properties Bootstrap sets change', async ({
        page,
    }) => {
        const probe = PROBES['Chip'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        const { widened, ...rest } = splitWidths(diff(without, withBootstrap));
        expect(rest).toEqual(LAYERED_CHIP_DIFF);
        // The reboot's `button { margin: 0 }` cancels the layered negative
        // margins that stretch the action button over the chip padding, so
        // chips with an action grow by that padding (8px per stretched side).
        expect(widened).toEqual({
            'action chip': 8,
            'action chip, action focused': 8,
            'hz-chip-disabled': 16,
        });
    });
});

// Measured: the chip surfaces (spans) are untouched; the reboot's
// `button { border-radius: 0 }` squares the remove button's hover circle and
// `button:focus { outline: 5px auto }` adds Bootstrap's ring on the focused
// buttons (the action button then shows it inside the chip's own ring).
const bootstrapRing = (style: string, width: string, color: string) => [
    `outlineStyle: ${style} -> auto`,
    `outlineWidth: ${width} -> 5px`,
    `outlineColor: ${color} -> rgb(0, 95, 204)`,
];
/** Pulls `width: a -> b` entries out of a diff as `{ key: b - a }`. */
const splitWidths = (changed: Record<string, string[]>) => {
    const widened: Record<string, number> = {};
    const rest: Record<string, string[]> = {};
    for (const [key, props] of Object.entries(changed)) {
        const others = props.filter((p) => {
            const m = /^width: ([\d.]+)px -> ([\d.]+)px$/.exec(p);
            if (m) widened[key] = Math.round(Number(m[2]) - Number(m[1]));
            return !m;
        });
        if (others.length > 0) rest[key] = others;
    }
    return { widened, ...rest };
};

const LAYERED_CHIP_DIFF = {
    'action button, focused': bootstrapRing('none', '0px', 'rgba(0, 0, 0, 0)'),
    'remove button': ['borderRadius: 100px -> 0px'],
    'remove button, focused': [
        'borderRadius: 100px -> 0px',
        ...bootstrapRing('solid', '2px', 'rgb(0, 80, 240)'),
    ],
};

test.describe('layered build (known limit): Badge against full Bootstrap', () => {
    test('badge spans are untouched; only the anchor follows its Button host', async ({
        page,
    }) => {
        const probe = PROBES['Badge'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        // The anchored host is a horizon Button, whose type Bootstrap's
        // `button { font: inherit }` enlarges in the layered build (known
        // Button limit, ADR 0001): only the anchor's width follows it.
        const changed = diff(without, withBootstrap);
        expect(Object.keys(changed)).toEqual(['hz-badge-anchor']);
        expect(changed['hz-badge-anchor']).toHaveLength(1);
        expect(changed['hz-badge-anchor']?.[0]).toMatch(/^width: /);
    });
});

test.describe('Chip hit layer with a real pointer', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    for (const build of ['layered', 'unlayered'] as const)
        test(`extended-area and visible clicks reach chip and row once each, and focus the button (${build})`, async ({
            page,
        }) => {
            await page.goto(url(build));
            const row = page.getByTestId('hz-chip-row');
            const chip = page.getByTestId('hz-chip-in-row');
            await chip.scrollIntoViewIfNeeded();
            const box = await chip.boundingBox();
            if (!box) throw new Error('chip not rendered');
            const counts = async () => ({
                chip: await row.getAttribute('data-chip-clicks'),
                row: await row.getAttribute('data-row-clicks'),
                native: await row.getAttribute('data-native-clicks'),
            });
            // 8px above the 24px chip: inside the 44px hit area only.
            await page.mouse.click(box.x + box.width / 2, box.y - 8);
            expect(await counts()).toEqual({
                chip: '1',
                row: '1',
                native: '1',
            });
            const focus = await page.evaluate(() => {
                const el = document.activeElement;
                return {
                    action: el?.hasAttribute('data-chip-action') ?? false,
                    visible: el?.matches(':focus-visible') ?? false,
                };
            });
            expect(focus).toEqual({ action: true, visible: false });
            expect(
                await chip.evaluate((el) => getComputedStyle(el).outlineStyle)
            ).toBe('none');
            // The visible chip.
            await page.mouse.click(
                box.x + box.width / 2,
                box.y + box.height / 2
            );
            expect(await counts()).toEqual({
                chip: '2',
                row: '2',
                native: '2',
            });
        });
});

test.describe('layered build (known limit): Spinner against full Bootstrap', () => {
    test('spinner spans and the ring svg are untouched', async ({ page }) => {
        const probe = PROBES['Spinner'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        // Bootstrap's `svg { vertical-align: middle }` (unlayered) beats the
        // layered `hz:align-top`; the svg is display:block, so nothing moves.
        expect(diff(without, withBootstrap)).toEqual({
            'ring svg': ['verticalAlign: top -> middle'],
        });
    });
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    for (const build of ['layered', 'unlayered'] as const)
        test(`loading indicators slow down instead of stopping; other motion still collapses (${build})`, async ({
            page,
        }) => {
            await page.goto(url(build, { reboot: 'full' }));
            const timing = (selector: string) =>
                page.locator(selector).evaluate((el) => {
                    const cs = getComputedStyle(el);
                    return {
                        name: cs.animationName,
                        duration: cs.animationDuration,
                        iterations: cs.animationIterationCount,
                        transition: cs.transitionDuration,
                        running: el
                            .getAnimations()
                            .map((a) => a.playState)
                            .join(),
                    };
                });
            const slow = {
                name: 'hz-spin',
                duration: '3s',
                iterations: 'infinite',
                transition: '0s',
                running: 'running',
            };
            expect(await timing(byTestId('hz-spinner-sm'))).toEqual(slow);
            expect(
                await timing(
                    `${byTestId('hz-ltr-loading')} [data-hz-motion="essential"]`
                )
            ).toEqual(slow);
            // Indeterminate Progress: the full bar pulses, it does not travel.
            const segment = `${byTestId('hz-progress-indeterminate')} [data-progress-indicator]`;
            expect(await timing(segment)).toEqual({
                name: 'hz-progress-pulse',
                duration: '2s',
                iterations: 'infinite',
                transition: '0s',
                running: 'running',
            });
            const widths = await page
                .locator(segment)
                .evaluate((el) => [
                    el.getBoundingClientRect().width,
                    el.parentElement?.getBoundingClientRect().width,
                ]);
            expect(widths[0]).toBe(widths[1]);
            // The Button itself (not essential) keeps the kill switch.
            expect((await timing(byTestId('hz-ltr-loading'))).transition).toBe(
                '1e-05s'
            );
        });
});

test.describe('layered build: Separator against full Bootstrap', () => {
    test('a div separator is untouched (Bootstrap only styles hr)', async ({
        page,
    }) => {
        const probe = PROBES['Separator'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual({});
        expect(without['hz-separator-h']?.['height']).toBe('1px');
        expect(without['hz-separator-v']?.['width']).toBe('1px');
    });
});

test.describe('layered build: Progress against full Bootstrap', () => {
    test('progress divs and spans are untouched', async ({ page }) => {
        const probe = PROBES['Progress'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual({});
    });
});

test.describe('layered build (known limit): Alert against full Bootstrap', () => {
    test('the surface and text are untouched; only the buttons change', async ({
        page,
    }) => {
        const probe = PROBES['Alert'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        const { widened, ...rest } = splitWidths(diff(without, withBootstrap));
        expect(rest).toEqual(LAYERED_ALERT_DIFF);
        // The action Button grows with Bootstrap's `button { font: inherit }`
        // (known Button limit), so the text column narrows by as much.
        expect(Object.keys(widened).sort()).toEqual([
            'action',
            'description',
            'title',
        ]);
    });
});

// Measured: the surface, icon and text keep every property. The reboot's
// `button { margin: 0; border-radius: 0 }` cancels the dismiss button's
// negative margins and squares its hover circle, and `button:focus` adds
// Bootstrap's ring; the action is a horizon Button (ADR 0001 known limit).
const dismissLimit = [
    'marginTop: -6px -> 0px',
    'marginInlineEnd: -6px -> 0px',
    'borderRadius: 100px -> 0px',
];
const LAYERED_ALERT_DIFF = {
    action: [
        'borderRadius: 20px -> 0px',
        'fontSize: 12px -> 16px',
        'lineHeight: 16px -> 20px',
    ],
    dismiss: dismissLimit,
    'dismiss, focused': [
        ...dismissLimit,
        ...bootstrapRing('solid', '2px', 'rgb(0, 80, 240)'),
    ],
};

test.describe('layered build: Avatar against full Bootstrap', () => {
    test('avatar spans are untouched; only invisible img properties follow Bootstrap', async ({
        page,
    }) => {
        const probe = PROBES['Avatar'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        // `img { vertical-align: middle; border-style: none }` (unlayered)
        // beats the layered `hz:align-top hz:border-0`; the img is absolutely
        // positioned and its border width stays 0, so nothing moves.
        expect(diff(without, withBootstrap)).toEqual({
            'photo img': [
                'borderTopStyle: solid -> none',
                'verticalAlign: top -> middle',
            ],
        });
    });
});

/**
 * Anchor-rendered components against the reboot's `a` rules, every
 * interaction state, unlayered build: identical with bootstrap-reboot.css and
 * full bootstrap.css, in both load orders, and on a touch device (sticky
 * hover without hover media).
 */
const anchorSuite = (name: string, ids: readonly string[]) => {
    test.describe(`${name} anchors: unlayered build vs Bootstrap a, a:hover, a:not([href])`, () => {
        for (const legacy of LEGACY_CSS)
            for (const horizonFirst of [false, true])
                test(`every state unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    const without = await linkStates(
                        page,
                        url('unlayered'),
                        ids
                    );
                    expect(Object.keys(without)).toHaveLength(
                        ids.length * LINK_STATES.length
                    );
                    const withBootstrap = await linkStates(
                        page,
                        url('unlayered', { ...legacy.opts, horizonFirst }),
                        ids
                    );
                    expect(diffStates(without, withBootstrap)).toEqual({});
                });
    });

    test.describe(`${name} anchors on a touch device (no hover media), unlayered build`, () => {
        test.use({ hasTouch: true, isMobile: true });
        for (const horizonFirst of [false, true])
            test(`sticky :hover shows no Bootstrap a:hover look (${horizonFirst ? 'horizon first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await linkStates(
                    page,
                    url('unlayered'),
                    ids,
                    true
                );
                expect(
                    await page.evaluate(
                        () => matchMedia('(hover: hover)').matches
                    )
                ).toBe(false);
                const withBootstrap = await linkStates(
                    page,
                    url('unlayered', {
                        reboot: 'full',
                        host: true,
                        horizonFirst,
                    }),
                    ids,
                    true
                );
                expect(diffStates(without, withBootstrap)).toEqual({});
            });
    });
};

anchorSuite(
    'Button asChild',
    BUTTON_VARIANTS.map((v) => `hz-link-${v}`)
);

anchorSuite(
    'IconButton asChild',
    ICON_BUTTON_VARIANTS.map((v) => `hz-iconlink-${v}`)
);

test.describe('layered build (known limit): IconButton against full Bootstrap', () => {
    test('buttons lose the radius and focus ring; asChild links take the reboot link colour', async ({
        page,
    }) => {
        const probe = PROBES['IconButton'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual(LAYERED_ICON_BUTTON_DIFF);
    });
});

// Measured: Bootstrap's `button { border-radius: 0; line-height: inherit }`
// squares the buttons (line height has no visual effect on the fixed box) and
// `button:focus` adds its ring; the reboot's `a` colour and the missing fill
// win on asChild links. Legacy hosts use styles.unlayered.css (ADR 0001).
const squared = ['borderRadius: 100px -> 0px', 'lineHeight: 16px -> 24px'];
const rebootLinkColour = (from: string) => `color: ${from} -> rgb(0, 123, 255)`;
const LAYERED_ICON_BUTTON_DIFF = {
    'hz-iconbutton-primary': squared,
    'hz-iconbutton-secondary': squared,
    'hz-iconbutton-tertiary': squared,
    'hz-iconbutton-destructive': squared,
    'hz-iconbutton-ghost': squared,
    'hz-iconbutton-disabled': squared,
    'hz-iconbutton-loading': [...squared, 'cursor: progress -> pointer'],
    'hz-iconlink-primary': [
        rebootLinkColour('rgb(255, 255, 255)'),
        'backgroundColor: rgb(0, 80, 240) -> rgba(0, 0, 0, 0)',
    ],
    'hz-iconlink-secondary': [rebootLinkColour('rgb(0, 80, 240)')],
    'hz-iconlink-tertiary': [rebootLinkColour('rgb(0, 80, 240)')],
    'hz-iconlink-destructive': [
        rebootLinkColour('rgb(255, 255, 255)'),
        'backgroundColor: rgb(231, 13, 50) -> rgba(0, 0, 0, 0)',
    ],
    'hz-iconlink-ghost': [rebootLinkColour('rgb(15, 23, 42)')],
    'link, focused': [rebootLinkColour('rgb(15, 23, 42)')],
    'icon svg': ['lineHeight: 16px -> 24px'],
    'primary, focused': [
        ...squared,
        ...bootstrapRing('solid', '2px', 'rgb(0, 80, 240)'),
    ],
};

test.describe('IconButton mouse focus against Bootstrap button:focus', () => {
    for (const horizonFirst of [false, true])
        test(`a clicked icon button shows no ring, unlayered build (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
            page,
        }) => {
            await page.goto(url('unlayered', { reboot: 'full', horizonFirst }));
            const button = page.getByTestId('hz-iconbutton-ghost');
            await button.click();
            expect(
                await button.evaluate((el) => [
                    el === document.activeElement,
                    el.matches(':focus-visible'),
                    getComputedStyle(el).outlineStyle,
                ])
            ).toEqual([true, false, 'none']);
        });
});

anchorSuite('Link', LINK_IDS);

test.describe('layered build (known limit): Link against full Bootstrap', () => {
    test('links take the reboot colour; the inline link loses its underline', async ({
        page,
    }) => {
        const probe = PROBES['Link'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual(LAYERED_LINK_DIFF);
    });
});

// Measured: the reboot's `a { color: #007bff; text-decoration: none }` and
// `a:not([href]) { color: inherit }` beat every layered utility: links turn
// Bootstrap blue, the inline link loses its underline (its non-colour cue)
// and the disabled link inherits the text colour. Type, size and focus ring
// survive. Legacy hosts must use styles.unlayered.css (ADR 0001).
const bootstrapBlue = (from: string) => `color: ${from} -> rgb(0, 123, 255)`;
const LAYERED_LINK_DIFF = {
    'hz-anchor-inline': [
        bootstrapBlue('rgb(0, 80, 240)'),
        'textDecorationLine: underline -> none',
    ],
    'hz-anchor-standalone': [bootstrapBlue('rgb(0, 80, 240)')],
    'standalone, focused': [bootstrapBlue('rgb(0, 80, 240)')],
    'hz-anchor-subtle': [bootstrapBlue('rgb(20, 120, 60)')],
    'hz-anchor-external': [bootstrapBlue('rgb(0, 80, 240)')],
    'external icon': [
        bootstrapBlue('rgb(0, 80, 240)'),
        'outlineColor: rgb(0, 80, 240) -> rgb(0, 123, 255)',
    ],
    'hz-anchor-disabled': ['color: rgb(71, 85, 105) -> rgb(15, 23, 42)'],
};

// KNOWN LIMIT, measured: in the layered build the host's unlayered
// `a { color }`, `a:hover`, `a:not([href])` and customer360's `a:hover,
// a:focus { text-decoration: none; outline: none }` win in every state: links
// are Bootstrap blue, the inline link has no underline and keyboard focus
// shows NO ring. customer360 must use styles.unlayered.css (ADR 0001).
test.describe('layered build (known limit): Link states against full Bootstrap + customer360 host CSS', () => {
    test('measured: Bootstrap colours, no inline underline, no focus ring', async ({
        page,
    }) => {
        const without = await linkStates(page, url('layered'), LINK_IDS);
        const withHost = await linkStates(
            page,
            url('layered', { reboot: 'full', host: true }),
            LINK_IDS
        );
        const changed = diffStates(without, withHost);
        // Every measured state of every link changed.
        expect(Object.keys(changed)).toHaveLength(
            LINK_IDS.length * LINK_STATES.length
        );
        const at = (id: string, state: string, prop: string) =>
            withHost[`hz-anchor-${id} ${state}`]?.[prop];
        for (const id of ['inline', 'standalone', 'subtle', 'external']) {
            expect(at(id, 'rest', 'color'), id).toBe('rgb(0, 123, 255)');
            expect(at(id, 'hover', 'color'), id).toBe('rgb(0, 86, 179)');
            expect(at(id, 'focus', 'outlineStyle'), id).toBe('none');
            expect(without[`hz-anchor-${id} focus`]?.['outlineStyle']).toBe(
                'solid'
            );
        }
        for (const state of LINK_STATES)
            expect(at('inline', state, 'textDecorationLine'), state).toBe(
                'none'
            );
        expect(at('disabled', 'rest', 'color')).toBe('rgb(15, 23, 42)');
    });
});

// KNOWN LIMIT of the LAYERED build for form controls (ADR 0001), measured
// against full bootstrap.css + customer360's host CSS (its `label`, `input`,
// `button + button` and `input::placeholder` rules). customer360 must use
// styles.unlayered.css, which the PROBES groups above prove unchanged.
// Width/height of text boxes depend on font metrics: only "changed" is kept.
const labelLimit = (color: string) => [
    'width: changed',
    'marginBottom: 0px -> 8px',
    'fontWeight: 600 -> 700',
    `color: ${color} -> rgb(67, 81, 119)`,
    'display: inline-flex -> block',
];
const choiceLabelLimit = (color: string) => [
    'width: changed',
    'marginBottom: 0px -> 8px',
    `color: ${color} -> rgb(67, 81, 119)`,
    'fontWeight: 400 -> 700',
    `outlineColor: ${color} -> rgb(67, 81, 119)`,
];
const selectTriggerLimit = [
    'borderRadius: 20px -> 0px',
    'fontSize: 14px -> 16px',
    'lineHeight: 14px -> 24px',
];
const LAYERED_FORMS_DIFF: Record<string, Record<string, string[]>> = {
    // customer360 `label { display: block; color; font-weight: bold }` and
    // the reboot's `margin-bottom: .5rem` win over the layered utilities.
    Label: {
        'hz-label': labelLimit('rgb(15, 23, 42)'),
        'hz-label-disabled': labelLimit('rgb(71, 85, 105)'),
        'required mark': [
            'width: changed',
            'height: changed',
            'fontWeight: 600 -> 700',
            'display: block -> inline',
        ],
    },
    // Inputs: Bootstrap's `input { line-height: inherit }` and customer360's
    // `input { font-size: 14px }` win; buttons lose radius and negative
    // margins, and customer360's `button:focus { outline: none }` removes the
    // clear button's focus ring.
    // Bootstrap's `textarea { line-height: inherit; resize: vertical }`.
    // `p { margin-bottom: 1rem }` on description and error, and the label
    // limit above; the error icon keeps its box (flex item).
    // The visual box and its focus ring are spans: untouched. The label
    // takes the host label rules; the 44px button only loses its (invisible)
    // radius. The layered build keeps the focus ring here.
    Checkbox: {
        'disabled label': choiceLabelLimit('rgb(71, 85, 105)'),
        'hz-checkbox': ['borderRadius: 4px -> 0px'],
        'hz-checkbox-checked': ['borderRadius: 4px -> 0px'],
        'hz-checkbox-disabled': ['borderRadius: 4px -> 0px'],
        'hz-checkbox-mixed': ['borderRadius: 4px -> 0px'],
        label: choiceLabelLimit('rgb(15, 23, 42)'),
        wrapper: ['width: changed', 'height: changed'],
    },
    // As Checkbox: circle, dot and focus ring are spans and survive.
    RadioGroup: {
        group: ['height: changed'],
        'hz-radio': ['borderRadius: 4px -> 0px'],
        'hz-radio-checked': ['borderRadius: 4px -> 0px'],
        'hz-radio-disabled': ['borderRadius: 4px -> 0px'],
        label: choiceLabelLimit('rgb(15, 23, 42)'),
    },
    // Track, thumb and focus ring are spans and survive.
    // As Input: Bootstrap's `button { font: inherit; border-radius: 0 }`
    // wins on the trigger; the clear button loses its circle and takes
    // customer360's `button + button { margin-left: 8px }` (it follows the
    // trigger) and `button:focus` outline values.
    Select: {
        chevron: ['fontSize: 14px -> 16px', 'lineHeight: 14px -> 24px'],
        'clear button': [
            'marginTop: 4px -> 0px',
            'marginBottom: 4px -> 0px',
            'marginInlineStart: 0px -> 8px',
            'borderRadius: 100px -> 0px',
        ],
        'hz-select': selectTriggerLimit,
        'hz-select-value': selectTriggerLimit,
        'trigger, focused': [
            ...selectTriggerLimit,
            'outlineWidth: 2px -> 3px',
            'outlineColor: rgb(0, 80, 240) -> rgb(71, 85, 105)',
        ],
        'value text': [
            'height: changed',
            'fontSize: 14px -> 16px',
            'lineHeight: 14px -> 24px',
        ],
    },
    // As Input: Bootstrap's `input { line-height: inherit }`; the round
    // end buttons and the chip remove button lose their radius, and
    // customer360's `button:focus { outline: none }` removes the clear
    // button's ring.
    // As Input (type=search): the reboot's `[type='search']` outline offset
    // and `input { line-height }`; both buttons lose radius and their
    // negative tuck margin; the focused search button loses its ring to
    // customer360's `button:focus { outline: none }`.
    // Layered build: Bootstrap's `button` radius/font and customer360's
    // `button + button { margin-left: 8px }` split the pill (the unlayered
    // build keeps it joined, asserted above).
    // As Input; the steppers lose their circle and the increase button
    // takes customer360's `button + button { margin-left: 8px }`.
    // As Combobox: input line-height and the round buttons' radius.
    // The pills are buttons: Bootstrap's radius/font and customer360's
    // `button:focus` outline win in the layered build.
    Filter: {
        'hz-filter': [
            'width: changed',
            'borderRadius: 100px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
        ],
        'hz-filter-toggle': [
            'width: changed',
            'borderRadius: 100px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
        ],
        'pill, focused': [
            'width: changed',
            'borderRadius: 100px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
            'outlineColor: rgb(0, 80, 240) -> rgb(31, 50, 88)',
        ],
    },
    EmailsField: {
        'chip remove button': ['borderRadius: 100px -> 0px'],
        'clear all': ['borderRadius: 100px -> 0px'],
        'hz-emails': ['lineHeight: 14px -> 21px'],
    },
    NumberInput: {
        'decrease (button + button target)': ['borderRadius: 100px -> 0px'],
        'hz-number': ['width: changed', 'lineHeight: 14px -> 21px'],
        increase: [
            'marginInlineStart: 0px -> 8px',
            'borderRadius: 100px -> 0px',
        ],
    },
    SplitButton: {
        'hz-split group': ['width: changed'],
        'hz-split main': [
            'width: changed',
            'borderRadius: 20px 0px 0px 20px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
        ],
        'hz-split menu': [
            'marginInlineStart: 0px -> 8px',
            'borderRadius: 0px 20px 20px 0px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
        ],
        'hz-split menu, focused': [
            'marginInlineStart: 0px -> 8px',
            'borderRadius: 0px 20px 20px 0px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
            'outlineColor: rgb(0, 80, 240) -> rgb(255, 255, 255)',
        ],
        'hz-split-secondary group': ['width: changed'],
        'hz-split-secondary main': [
            'width: changed',
            'borderRadius: 20px 0px 0px 20px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
        ],
        'hz-split-secondary menu': [
            'marginInlineStart: -1px -> 8px',
            'borderRadius: 0px 20px 20px 0px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
        ],
        'hz-split-secondary menu, focused': [
            'marginInlineStart: -1px -> 8px',
            'borderRadius: 0px 20px 20px 0px -> 0px',
            'fontSize: 14px -> 16px',
            'lineHeight: 20px -> 24px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
        ],
    },
    SearchBar: {
        'clear button': [
            'marginInlineEnd: -8px -> 0px',
            'borderRadius: 100px -> 0px',
        ],
        'hz-searchbar': [
            'width: changed',
            'lineHeight: 14px -> 21px',
            'outlineOffset: 0px -> -2px',
        ],
        'hz-searchbar-loading': [
            'width: changed',
            'lineHeight: 14px -> 21px',
            'outlineOffset: 0px -> -2px',
        ],
        'search button': [
            'marginInlineStart: -8px -> 0px',
            'borderRadius: 100px -> 0px',
        ],
        'search button, focused': [
            'marginInlineStart: -8px -> 0px',
            'borderRadius: 100px -> 0px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
        ],
    },
    Combobox: {
        'chip remove button': ['borderRadius: 100px -> 0px'],
        'clear button': ['borderRadius: 100px -> 0px'],
        'clear button, focused': [
            'borderRadius: 100px -> 0px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
            'outlineColor: rgb(0, 80, 240) -> rgb(71, 85, 105)',
        ],
        'hz-combobox': ['lineHeight: 14px -> 21px'],
        // The (default) clear button's radius change shifts the input width.
        'hz-combobox-multi': ['width: changed', 'lineHeight: 14px -> 21px'],
        'hz-combobox-value': ['width: changed', 'lineHeight: 14px -> 21px'],
        'toggle button': ['borderRadius: 100px -> 0px'],
    },
    Switch: {
        'hz-switch': ['borderRadius: 100px -> 0px'],
        'hz-switch-on': ['borderRadius: 100px -> 0px'],
        label: choiceLabelLimit('rgb(15, 23, 42)'),
    },
    FormField: {
        description: ['marginBottom: 0px -> 16px'],
        error: ['marginBottom: 0px -> 16px'],
        field: ['height: changed'],
        label: [
            'width: changed',
            'marginBottom: 0px -> 8px',
            'fontWeight: 600 -> 700',
            'color: rgb(15, 23, 42) -> rgb(67, 81, 119)',
            'display: flex -> block',
        ],
    },
    Textarea: {
        focused: ['height: changed', 'lineHeight: 20px -> 24px'],
        'hz-textarea': ['height: changed', 'lineHeight: 20px -> 24px'],
        'hz-textarea-disabled': ['height: changed', 'lineHeight: 20px -> 24px'],
        'hz-textarea-invalid': [
            'height: changed',
            'lineHeight: 20px -> 24px',
            'resize: none -> vertical',
        ],
    },
    Input: {
        'adornment IconButton (button + button)': [
            'borderRadius: 100px -> 0px',
            'lineHeight: 16px -> 24px',
        ],
        'clear button': [
            'marginInlineEnd: -8px -> 0px',
            'borderRadius: 100px -> 0px',
        ],
        'clear button, focused': [
            'marginInlineEnd: -8px -> 0px',
            'borderRadius: 100px -> 0px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
            'outlineColor: rgb(0, 80, 240) -> rgb(71, 85, 105)',
        ],
        'hz-input': ['lineHeight: 14px -> 21px'],
        'hz-input-disabled': ['lineHeight: 14px -> 21px'],
        'hz-input-invalid': ['lineHeight: 14px -> 21px'],
        'hz-input-lg': ['fontSize: 16px -> 14px', 'lineHeight: 20px -> 21px'],
        'hz-input-number': ['lineHeight: 14px -> 21px'],
        'hz-input-sm': ['lineHeight: 14px -> 21px'],
        'search input': [
            'width: changed',
            'lineHeight: 14px -> 21px',
            'outlineOffset: 0px -> -2px',
        ],
    },
};

const sizeAgnostic = (changed: Record<string, string[]>) =>
    Object.fromEntries(
        Object.entries(changed).map(([key, props]) => [
            key,
            props.map((p) => p.replace(/^(width|height): .*$/, '$1: changed')),
        ])
    );

test.describe('layered build (known limit): form controls against full Bootstrap + customer360 host CSS', () => {
    for (const [name, expected] of Object.entries(LAYERED_FORMS_DIFF))
        test(`${name}: exactly the measured properties change`, async ({
            page,
        }) => {
            const probe = PROBES[name];
            if (!probe) throw new Error(`no probe ${name}`);
            const without = await measure(page, url('layered'), probe);
            const withHost = await measure(
                page,
                url('layered', { reboot: 'full', host: true }),
                probe
            );
            expect(sizeAgnostic(diff(without, withHost))).toEqual(expected);
        });
});

// `::placeholder` is a pseudo-element: measured separately. customer360 sets
// `input::placeholder { color: var(--default-light) }` (unlayered).
test.describe('form placeholders against customer360 host CSS', () => {
    for (const horizonFirst of [false, true])
        test(`placeholder colour unchanged, unlayered build (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
            page,
        }) => {
            const read = async (path: string) => {
                await page.goto(path);
                return page
                    .getByTestId('hz-input')
                    .evaluate(
                        (el) => getComputedStyle(el, '::placeholder').color
                    );
            };
            const without = await read(url('unlayered'));
            const withHost = await read(
                url('unlayered', { reboot: 'full', host: true, horizonFirst })
            );
            expect(withHost).toBe(without);
            expect(without).toBe('rgb(71, 85, 105)');
        });
});

/** Styles of the open Select list (content and an option). */
const openList = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-select').click();
    const option = page.getByRole('option', { name: 'Globex' });
    await expect(option).toBeVisible();
    return page.evaluate(
        (props) => {
            const read = (el: Element | null) => {
                if (!el) return {};
                const cs = getComputedStyle(el);
                return Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
            };
            const listbox = document.querySelector('[role="listbox"]');
            return {
                content: read(
                    listbox?.closest('[data-select-content]') ?? null
                ),
                option: read(document.querySelector('[role="option"]')),
                group: read(listbox),
            };
        },
        [...FIELD_PROPS, 'zIndex']
    );
};

test.describe('Select open list against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: list and options unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openList(page, url('unlayered'));
                const withHost = await openList(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.content['zIndex']).toBe('1400');
            });
});

test.describe('Select inside an MUI dialog (z-index 1300)', () => {
    for (const build of ['layered', 'unlayered'] as const)
        test(`the list opens above the dialog and selects (${build})`, async ({
            page,
        }) => {
            await page.goto(url(build, { reboot: 'full', host: true }));
            await page.getByTestId('open-mui-dialog').click();
            const trigger = page.getByTestId('hz-select-dialog');
            await trigger.click();
            const option = page.getByRole('option', { name: 'Initech' });
            await expect(option).toBeVisible();
            // The topmost element at the option's centre is the option.
            const box = await option.boundingBox();
            if (!box) throw new Error('no option box');
            const top = await page.evaluate(
                ([x, y]) =>
                    document
                        .elementFromPoint(x ?? 0, y ?? 0)
                        ?.closest('[role="option"]')?.textContent ?? null,
                [box.x + box.width / 2, box.y + box.height / 2]
            );
            expect(top).toBe('Initech');
            const z = await option.evaluate(
                (el) =>
                    getComputedStyle(
                        el.closest('[data-radix-popper-content-wrapper]') ?? el
                    ).zIndex
            );
            expect(z).toBe('1400');
            await page.mouse.click(
                box.x + box.width / 2,
                box.y + box.height / 2
            );
            await expect(trigger).toHaveText('Initech');
            await expect(trigger).toBeFocused();
            await expect(page.getByTestId('mui-dialog-content')).toBeVisible();
        });

    // KNOWN LIMIT (measured): a Select whose nearest HorizonProvider is
    // outside the MUI dialog portals its list outside the dialog DOM. It is
    // above the dialog (z 1400), but its trigger inside the dialog is outside
    // `.hz-root`, so it has no Horizon variables (unstyled). Wrap MUI dialog
    // content in a HorizonProvider.
    test('known limit: without a provider inside the dialog the trigger has no Horizon variables', async ({
        page,
    }) => {
        await page.goto(url('unlayered'));
        await page.getByTestId('open-mui-dialog').click();
        const outer = page.getByTestId('hz-select-dialog-outer');
        expect(
            await outer.evaluate((el) => [
                el.closest('.hz-root') === null,
                getComputedStyle(el).getPropertyValue('--primary'),
            ])
        ).toEqual([true, '']);
        const inner = page.getByTestId('hz-select-dialog');
        expect(
            await inner.evaluate((el) =>
                getComputedStyle(el)
                    .getPropertyValue('--primary')
                    .trim()
                    .toUpperCase()
            )
        ).toBe('#0050F0');
    });
});

/**
 * Keyboard and pointer use of a Select inside a real MUI Dialog, unlayered
 * build with full Bootstrap + customer360 host CSS. `inner`: a
 * `<HorizonProvider>` (no props, inherits) wraps the dialog content (the
 * documented pattern). `outer`: only the app-level provider (React context
 * crosses MUI's portal, the DOM does not).
 */
const DIALOG_CASES = {
    inner: { select: 'hz-select-dialog', input: 'hz-input-dialog' },
    outer: { select: 'hz-select-dialog-outer', input: 'hz-input-dialog-outer' },
} as const;

/**
 * Waits until Radix has placed the open list (the popper wrapper leaves its
 * off-screen measuring position) and moved focus to a highlighted option.
 * Measured: a key sent in the ~10-25ms between the list opening and that
 * focus can act on the first option instead; a person cannot type that fast,
 * so the tests wait for the focus instead of sleeping.
 */
const listSettled = async (page: Page) => {
    await page.waitForFunction(() => {
        const wrapper = document.querySelector(
            '[data-radix-popper-content-wrapper]'
        );
        const active = document.activeElement;
        return (
            wrapper !== null &&
            !(wrapper.getAttribute('style') ?? '').includes('-200%') &&
            active?.getAttribute('role') === 'option' &&
            active.hasAttribute('data-highlighted')
        );
    });
};

const dialogSelect = async (page: Page, testId: string) => {
    await page.goto(url('unlayered', { reboot: 'full', host: true }));
    await page.getByTestId('open-mui-dialog').click();
    // Keep the cursor off the list so a hover cannot move the highlight
    // during the keyboard steps.
    await page.mouse.move(1, 1);
    const trigger = page.getByTestId(testId);
    await expect(trigger).toBeVisible();
    return trigger;
};

const scopeOf = (page: Page, testId: string) =>
    page.getByTestId(testId).evaluate((el) => ({
        inHzRoot: el.closest('.hz-root') !== null,
        primary: getComputedStyle(el)
            .getPropertyValue('--primary')
            .trim()
            .toUpperCase(),
        radius: getComputedStyle(el.closest('[data-input-field]') ?? el)
            .borderRadius,
    }));

test.describe('Horizon controls inside an MUI dialog (unlayered + host CSS)', () => {
    test('inner provider: scoped and styled; keyboard opens, selects, Escape closes only the list', async ({
        page,
    }) => {
        const trigger = await dialogSelect(page, DIALOG_CASES.inner.select);
        expect(await scopeOf(page, DIALOG_CASES.inner.select)).toEqual({
            inHzRoot: true,
            primary: '#0050F0',
            radius: '20px',
        });
        expect(await scopeOf(page, DIALOG_CASES.inner.input)).toEqual({
            inHzRoot: true,
            primary: '#0050F0',
            radius: '20px',
        });
        await trigger.focus();
        await page.keyboard.press('Enter');
        // Role queries skip aria-hidden content: options must be exposed.
        await expect(
            page.getByRole('option', { name: 'Acme Ltd.' })
        ).toBeFocused();
        expect(
            await page
                .getByRole('listbox')
                .evaluate((el) => el.closest('.hz-root') !== null)
        ).toBe(true);
        await listSettled(page);
        await page.keyboard.press('ArrowDown');
        await expect(
            page.getByRole('option', { name: 'Globex' })
        ).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveText('Globex');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('listbox')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('listbox')).toHaveCount(0);
        await expect(page.getByTestId('mui-dialog-content')).toBeVisible();
        await expect(trigger).toBeFocused();
        // Pointer.
        await trigger.click();
        await page.getByRole('option', { name: 'Initech' }).click();
        await expect(trigger).toHaveText('Initech');
        await page.getByTestId(DIALOG_CASES.inner.input).fill('acme');
        await expect(page.getByTestId(DIALOG_CASES.inner.input)).toHaveValue(
            'acme'
        );
    });

    test('outer provider only (measured, NOT usable): unstyled, and the list is aria-hidden by MUI', async ({
        page,
    }) => {
        const trigger = await dialogSelect(page, DIALOG_CASES.outer.select);
        // KNOWN LIMIT 1: the controls are outside any .hz-root, so
        // `var(--primary)` resolves to Bootstrap's own :root `--primary`
        // (#007bff) and the other Horizon variables are missing.
        expect(await scopeOf(page, DIALOG_CASES.outer.select)).toEqual({
            inHzRoot: false,
            primary: '#007BFF',
            radius: '20px',
        });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible();
        // KNOWN LIMIT 2: the list portals into the app-level provider, inside
        // #root, which MUI's ModalManager marks aria-hidden while the dialog
        // is open: screen readers cannot reach the options (role queries,
        // which skip aria-hidden content, find none) although focus is on one.
        expect(
            await listbox.evaluate(
                (el) => el.closest('[aria-hidden="true"]')?.id ?? null
            )
        ).toBe('root');
        await expect(page.getByRole('option')).toHaveCount(0);
        expect(
            await page.evaluate(
                () => document.activeElement?.getAttribute('role') ?? null
            )
        ).toBe('option');
        // Keyboard and pointer selection still work for sighted users.
        await listSettled(page);
        await page.keyboard.press('ArrowDown');
        // Role queries skip the aria-hidden list: wait on the DOM focus.
        await page.waitForFunction(
            () => document.activeElement?.textContent === 'Globex'
        );
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveText('Globex');
        await trigger.click();
        await page.locator('[role="option"]', { hasText: 'Initech' }).click();
        await expect(trigger).toHaveText('Initech');
        await expect(page.getByTestId('mui-dialog-content')).toBeVisible();
    });
});

test.describe('Select inside x-core DialogV2 (disablePortal + Slide)', () => {
    for (const build of ['layered', 'unlayered'] as const)
        test(`the list opens under its trigger above the dialog and selects (${build})`, async ({
            page,
        }) => {
            await page.goto(
                `${url(build, { reboot: 'full', host: true })}&mui=v2`
            );
            await page.getByTestId('open-mui-dialog').click();
            await page.waitForFunction(() => {
                const paper = document
                    .querySelector('[data-testid="mui-dialog-content"]')
                    ?.closest('.MuiDialog-paper');
                return (
                    paper !== null &&
                    paper !== undefined &&
                    getComputedStyle(paper).transform === 'none'
                );
            });
            const trigger = page.getByTestId('hz-select-dialog');
            await trigger.click();
            // Role queries skip it: x-core DialogV2 sits inside the
            // aria-hidden #root (measured x-core defect, see overlays.spec).
            const option = page.locator('[role="option"]', {
                hasText: 'Initech',
            });
            await expect(option).toBeVisible();
            const tb = await trigger.boundingBox();
            const list = await page
                .locator('[data-select-content]')
                .boundingBox();
            if (!tb || !list) throw new Error('no box');
            // Not offset by the Slide transform: right under the trigger.
            expect(
                Math.abs(list.y - (tb.y + tb.height) - 4)
            ).toBeLessThanOrEqual(1);
            await option.click();
            await expect(trigger).toHaveText('Initech');
            await expect(page.getByTestId('mui-dialog-content')).toBeVisible();
        });
});

/** Styles of the open Combobox list (content and an option). */
const openCombobox = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-combobox').click();
    const option = page.getByRole('option', { name: 'Globex' });
    await expect(option).toBeVisible();
    await page.waitForFunction(() =>
        document
            .querySelector('[data-combobox-content]')
            ?.getAnimations()
            .every((a) => a.playState === 'finished')
    );
    return page.evaluate(
        (props) => {
            const read = (el: Element | null) => {
                if (!el) return {};
                const cs = getComputedStyle(el);
                return Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
            };
            return {
                content: read(
                    document.querySelector('[data-combobox-content]')
                ),
                option: read(document.querySelector('[role="option"]')),
                listbox: read(document.querySelector('[role="listbox"]')),
            };
        },
        [...FIELD_PROPS, 'zIndex']
    );
};

test.describe('Combobox open list against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: list and options unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openCombobox(page, url('unlayered'));
                const withHost = await openCombobox(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.content['zIndex']).toBe('1400');
            });
});

test.describe('Combobox inside MUI dialogs (inner HorizonProvider)', () => {
    for (const build of ['layered', 'unlayered'] as const)
        for (const v2 of [false, true])
            for (const horizonFirst of [false, true])
                test(`the list opens above the dialog; keyboard picks; Escape closes only the list; pointer pick (${build}${v2 ? ', x-core DialogV2' : ''}, ${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    await page.goto(
                        `${url(build, { reboot: 'full', host: true, horizonFirst })}${v2 ? '&mui=v2' : ''}`
                    );
                    await page.getByTestId('open-mui-dialog').click();
                    const input = page.getByTestId('hz-combobox-dialog');
                    await expect(input).toBeVisible();
                    if (v2)
                        await page.waitForFunction(() => {
                            const paper = document
                                .querySelector(
                                    '[data-testid="mui-dialog-content"]'
                                )
                                ?.closest('.MuiDialog-paper');
                            return (
                                paper !== null &&
                                paper !== undefined &&
                                getComputedStyle(paper).transform === 'none'
                            );
                        });
                    await input.click();
                    await page.keyboard.type('init');
                    // Role queries skip DialogV2 content (aria-hidden #root, x-core defect).
                    const option = page.locator('[role="option"]', {
                        hasText: 'Initech',
                    });
                    await expect(option).toBeVisible();
                    const box = await option.boundingBox();
                    if (!box) throw new Error('no option box');
                    const top = await page.evaluate(
                        ([x, y]) =>
                            document
                                .elementFromPoint(x ?? 0, y ?? 0)
                                ?.closest('[role="option"]')?.textContent ??
                            null,
                        [box.x + box.width / 2, box.y + box.height / 2]
                    );
                    expect(top).toBe('Initech');
                    const ib = await input.locator('xpath=..').boundingBox();
                    const list = await page
                        .locator('[data-combobox-content]')
                        .boundingBox();
                    if (!ib || !list) throw new Error('no box');
                    expect(
                        Math.abs(list.y - (ib.y + ib.height) - 4)
                    ).toBeLessThanOrEqual(1);
                    await page.keyboard.press('Enter');
                    await expect(input).toHaveValue('Initech');
                    await expect(input).toBeFocused();
                    await input.press('ArrowDown');
                    await expect(option).toBeVisible();
                    await page.keyboard.press('Escape');
                    await expect(
                        page.locator('[data-combobox-content]')
                    ).toHaveCount(0);
                    await expect(
                        page.getByTestId('mui-dialog-content')
                    ).toBeVisible();
                    // Pointer pick: the click lands on the portaled option, the
                    // MUI dialog stays open and focus stays in the input.
                    await input.click();
                    const acme = page.locator('[role="option"]', {
                        hasText: 'Acme Ltd.',
                    });
                    await acme.click();
                    await expect(input).toHaveValue('Acme Ltd.');
                    await expect(input).toBeFocused();
                    await expect(
                        page.getByTestId('mui-dialog-content')
                    ).toBeVisible();
                });
});

test.describe('Filter panel against Bootstrap 4.4.1 and customer360 host CSS', () => {
    const openPanel = async (page: Page, path: string) => {
        await page.goto(path);
        await page.getByTestId('hz-filter').click();
        const panel = page.locator('[data-filter-panel]');
        await expect(panel).toBeVisible();
        await page.waitForFunction(() =>
            document
                .querySelector('[data-filter-panel]')
                ?.getAnimations()
                .every((a) => a.playState === 'finished')
        );
        return page.evaluate(
            (props) => {
                const read = (el: Element | null) => {
                    if (!el) return {};
                    const cs = getComputedStyle(el);
                    // The first option takes focus on open (no ring: mouse
                    // focus). With `outline-style: none` the width and
                    // colour (Bootstrap's button:focus values) draw nothing.
                    const hidden = cs.outlineStyle === 'none';
                    return Object.fromEntries(
                        props
                            .filter(
                                (p) =>
                                    !hidden ||
                                    !['outlineWidth', 'outlineColor'].includes(
                                        p
                                    )
                            )
                            .map((p) => [
                                p,
                                cs[p as keyof CSSStyleDeclaration] as string,
                            ])
                    );
                };
                const panel = document.querySelector('[data-filter-panel]');
                return {
                    panel: read(panel),
                    checkbox: read(
                        panel?.querySelector('[role="checkbox"]') ?? null
                    ),
                    label: read(panel?.querySelector('label') ?? null),
                };
            },
            [...FIELD_PROPS, 'zIndex']
        );
    };
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: panel and options unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openPanel(page, url('unlayered'));
                const withHost = await openPanel(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.panel['zIndex']).toBe('1450');
            });
});

/*
 * Mouse (pointer) focus. The probes above focus with keyboard modality
 * (`:focus-visible`). A mouse press, or focus returning to a trigger after
 * a pointer-closed overlay, matches `:focus` only, where Bootstrap's
 * `button:focus { outline: 5px auto }` (0,1,1) and customer360's
 * `button:focus` apply. Each button-like control must show no ring, and
 * nothing from the host, in the unlayered build.
 */
type PointerTarget = {
    key: string;
    selector: string;
    /** Steps that leave the element focused by the pointer (default: press without click). */
    focus?: (page: Page, selector: string) => Promise<void>;
};

/** Press on the element, leave it, release elsewhere: focus without activation. */
const pressWithoutClick = async (page: Page, selector: string) => {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw new Error(`no box for ${selector}`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(1, 1);
    await page.mouse.up();
};

const POINTER_TARGETS: PointerTarget[] = [
    ...BUTTON_VARIANTS.map((v) => ({
        key: `Button ${v}`,
        selector: byTestId(`hz-variant-${v}`),
    })),
    { key: 'IconButton', selector: byTestId('hz-iconbutton-ghost') },
    {
        key: 'Chip action',
        selector: `${byTestId('hz-chip-action')} [data-chip-action]`,
    },
    {
        key: 'Chip remove',
        selector: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
    },
    {
        key: 'Alert dismiss',
        selector: alertPart('button[aria-label="Dismiss"]'),
    },
    { key: 'Checkbox', selector: byTestId('hz-checkbox') },
    { key: 'Radio', selector: byTestId('hz-radio') },
    { key: 'Switch', selector: byTestId('hz-switch') },
    { key: 'Select trigger', selector: byTestId('hz-select') },
    {
        key: 'Input clear',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
    },
    {
        key: 'SearchBar search button',
        selector: `${fieldOf('hz-searchbar')} [data-search-button]`,
    },
    // The Combobox clear and toggle buttons never take pointer focus
    // (mousedown is prevented so focus stays in the input).
    {
        key: 'Combobox chip remove',
        selector: `${comboboxField('hz-combobox-multi')} button[aria-label="Remove Globex"]`,
    },
    {
        key: 'EmailsField chip remove',
        selector: `[data-emails-field]:has(> ${byTestId('hz-emails')}) button[aria-label="Remove dana@example.com"]`,
    },
    {
        key: 'EmailsField clear all',
        selector: `[data-emails-field]:has(> ${byTestId('hz-emails')}) button[aria-label="Clear all"]`,
    },
    {
        key: 'SplitButton main',
        selector: `${byTestId('hz-split')} [data-split-main]`,
    },
    {
        key: 'SplitButton menu, focus returned after a pointer pick',
        selector: `${byTestId('hz-split')} [data-split-menu]`,
        focus: async (page, selector) => {
            await page.locator(selector).click();
            await page.getByRole('menuitemradio', { name: 'Import' }).click();
            await expect(page.getByRole('menu')).toHaveCount(0);
            await expect(page.locator(selector)).toBeFocused();
        },
    },
    { key: 'Filter pill', selector: byTestId('hz-filter') },
    {
        key: 'Filter pill, focus returned after a pointer close',
        selector: byTestId('hz-filter'),
        focus: async (page, selector) => {
            await page.locator(selector).click();
            await expect(page.locator('[data-filter-panel]')).toBeVisible();
            await page.locator(selector).click();
            await expect(page.locator('[data-filter-panel]')).toHaveCount(0);
            await expect(page.locator(selector)).toBeFocused();
        },
    },
    { key: 'Filter toggle', selector: byTestId('hz-filter-toggle') },
    {
        key: 'DropdownMenu trigger, focus returned after a pointer pick',
        selector: byTestId('hz-menu-trigger'),
        focus: async (page, selector) => {
            await page.locator(selector).click();
            await page.getByTestId('hz-menu-item').click();
            await expect(page.locator(selector)).toBeFocused();
        },
    },
    { key: 'Popover trigger', selector: byTestId('hz-popover-trigger') },
    {
        key: 'Toast dismiss',
        selector: '[data-did="hz-toast"] button[aria-label="Dismiss"]',
        focus: async (page, selector) => {
            await page.getByTestId('hz-toast-trigger').click();
            await expect(page.locator(selector)).toBeVisible();
            await pressWithoutClick(page, selector);
        },
    },
];

const RING_PROPS = [
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'boxShadow',
];

const mouseFocused = async (page: Page, path: string) => {
    const out: Record<string, Record<string, string>> = {};
    await page.goto(path);
    for (const target of POINTER_TARGETS) {
        await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur()
        );
        if (target.focus) await target.focus(page, target.selector);
        else {
            await page.locator(target.selector).scrollIntoViewIfNeeded();
            await pressWithoutClick(page, target.selector);
        }
        out[target.key] = await page
            .locator(target.selector)
            .first()
            .evaluate(async (el, props) => {
                await Promise.all(
                    el
                        .getAnimations()
                        .map((a) => a.finished.catch(() => undefined))
                );
                const cs = getComputedStyle(el);
                const read = Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
                // Width and colour of a style-none outline draw nothing.
                if (read['outlineStyle'] === 'none') {
                    delete read['outlineWidth'];
                    delete read['outlineColor'];
                }
                return {
                    ...read,
                    focused: String(el === document.activeElement),
                    focusVisible: String(el.matches(':focus-visible')),
                };
            }, RING_PROPS);
    }
    return out;
};

test.describe('mouse focus: button-like controls show no ring and nothing from the host', () => {
    test.describe.configure({ timeout: 120_000 });
    test('baseline (unlayered, no host CSS): focused by the pointer, not focus-visible, no outline', async ({
        page,
    }) => {
        const styles = await mouseFocused(page, url('unlayered'));
        for (const [key, s] of Object.entries(styles)) {
            expect([key, s['focused'], s['focusVisible']]).toEqual([
                key,
                'true',
                'false',
            ]);
            expect([key, s['outlineStyle']]).toEqual([key, 'none']);
        }
    });
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await mouseFocused(page, url('unlayered'));
                const withHost = await mouseFocused(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
            });
});
