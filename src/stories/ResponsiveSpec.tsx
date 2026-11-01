import { breakpoints } from '../tokens';

/** The breakpoints a component documents, in ascending order. */
export type SpecBreakpoint = keyof typeof breakpoints;

/** What a component does at one breakpoint. */
export type BreakpointSpec = {
    /** Size: dimensions, type step, touch target (for example `h-11, text-body-default`). */
    size: string;
    /** Density: spacing step and padding (for example `gap-2, px-4`). */
    density: string;
    /** Layout: stacking, columns, alignment, overlay form (for example `full-screen sheet`). */
    layout: string;
    /** Content visibility: what is shown, truncated, collapsed or hidden. */
    contentVisibility: string;
    /** Interaction pattern: touch, pointer or keyboard behaviour, hover equivalents. */
    interaction: string;
    /** Optional free-text note, for example a justification for "identical at all four". */
    note?: string;
};

/** Props for {@link ResponsiveSpec}. */
export type ResponsiveSpecProps = {
    /** Spec for every breakpoint. All four are required: "identical" must be written down. */
    spec: Record<SpecBreakpoint, BreakpointSpec>;
    /** Accessible table caption. Defaults to "Responsive specification". */
    caption?: string;
};

const columns: readonly {
    key: keyof BreakpointSpec;
    label: string;
}[] = [
    { key: 'size', label: 'Size' },
    { key: 'density', label: 'Density' },
    { key: 'layout', label: 'Layout' },
    { key: 'contentVisibility', label: 'Content visibility' },
    { key: 'interaction', label: 'Interaction pattern' },
    { key: 'note', label: 'Note' },
];

const rows = Object.keys(breakpoints) as SpecBreakpoint[];

const cell = {
    padding: '8px 12px',
    textAlign: 'start',
    verticalAlign: 'top',
    borderBlockEnd: '1px solid var(--border)',
} as const;

/**
 * Story helper rendering the per-breakpoint specification every component's
 * `Responsive` story must carry (Responsive Standard: size, density, layout,
 * content visibility, interaction pattern, note for mobile, tablet, laptop and
 * desktop). Renders a semantic table: one row per breakpoint, one column per
 * field, with the breakpoint min-width in the row header. It is story-only and
 * not part of the public API. Layout uses inline styles because stories are
 * excluded from the Tailwind scan.
 */
export function ResponsiveSpec({
    spec,
    caption = 'Responsive specification',
}: ResponsiveSpecProps) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table
                style={{ borderCollapse: 'collapse', inlineSize: '100%' }}
                data-testid="responsive-spec"
            >
                <caption
                    style={{
                        ...cell,
                        fontWeight: 700,
                        borderBlockEnd: 'none',
                    }}
                >
                    {caption}
                </caption>
                <thead>
                    <tr>
                        <th scope="col" style={cell}>
                            Breakpoint
                        </th>
                        {columns.map((column) => (
                            <th key={column.key} scope="col" style={cell}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((name) => (
                        <tr key={name}>
                            <th scope="row" style={cell}>
                                {name}
                                <br />
                                <span
                                    style={{
                                        fontWeight: 400,
                                        color: 'var(--muted-foreground)',
                                    }}
                                >
                                    {breakpoints[name]}px+
                                </span>
                            </th>
                            {columns.map((column) => (
                                <td key={column.key} style={cell}>
                                    {spec[name][column.key] ?? '—'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
