import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    Alert,
    Badge,
    Chip,
    Progress,
    Separator,
    Spinner,
    Typography,
} from '../components';
import { resetWarnings } from '../lib/options';

/*
 * customer360 .jsx call sites pass x-core/MUI-only props (`sx`, palette
 * `color`, `fontWeight` ...). Untyped, they would be spread onto the DOM as
 * attributes (React warns about unknown camelCase props). Each component
 * drops them with a one-shot dev warning instead. Avatar, Button, IconButton
 * and Link are covered in their own tests.
 */

type Case = {
    name: string;
    Component: ComponentType<Record<string, unknown>>;
    props: Record<string, unknown>;
    legacy: Record<string, unknown>;
};

const cases: Case[] = [
    {
        name: 'Chip',
        Component: Chip as unknown as Case['Component'],
        props: { label: 'Open' },
        legacy: {
            sx: { p: 1 },
            color: 'primary',
            avatar: 'A',
            deleteIcon: 'x',
            clickable: true,
        },
    },
    {
        name: 'Badge',
        Component: Badge as unknown as Case['Component'],
        props: { children: 'New' },
        legacy: {
            sx: { p: 1 },
            color: 'error',
            badgeContent: 3,
            invisible: false,
            anchorOrigin: { vertical: 'top' },
        },
    },
    {
        name: 'Alert',
        Component: Alert as unknown as Case['Component'],
        props: { children: 'Saved' },
        legacy: {
            sx: { p: 1 },
            color: 'info',
            severity: 'info',
            onClose: () => undefined,
        },
    },
    {
        name: 'Spinner',
        Component: Spinner as unknown as Case['Component'],
        props: {},
        legacy: {
            sx: { p: 1 },
            color: 'primary',
            thickness: 4,
            disableShrink: true,
        },
    },
    {
        name: 'Progress',
        Component: Progress as unknown as Case['Component'],
        props: { 'aria-label': 'Loading' },
        legacy: { sx: { p: 1 }, color: 'primary', valueBuffer: 50 },
    },
    {
        name: 'Separator',
        Component: Separator as unknown as Case['Component'],
        props: {},
        legacy: {
            sx: { p: 1 },
            flexItem: true,
            light: true,
            textAlign: 'left',
        },
    },
    {
        name: 'Typography',
        Component: Typography as unknown as Case['Component'],
        props: { children: 'Text' },
        legacy: {
            sx: { p: 1 },
            fontWeight: 600,
            fontSize: 12,
            lineHeight: 1.2,
            gutterBottom: true,
            noWrap: true,
            paragraph: true,
            component: 'span',
            textAlign: 'center',
        },
    },
];

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('x-core-only props are dropped, not leaked to the DOM', () => {
    it.each(cases)('$name', ({ name, Component, props, legacy }) => {
        const warn = vi
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);
        const error = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
        const { container } = render(<Component {...props} {...legacy} />);
        const attributes = [...container.querySelectorAll('*')].flatMap((el) =>
            [...el.attributes].map((a) => a.name)
        );
        for (const prop of Object.keys(legacy))
            expect(attributes, `${name} ${prop}`).not.toContain(
                prop.toLowerCase()
            );
        expect(error).not.toHaveBeenCalled();
        const messages = warn.mock.calls.map(([m]) => String(m));
        for (const prop of Object.keys(legacy))
            expect(
                messages.some((m) => m.includes(`"${prop}"`)),
                `${name} warns about ${prop}`
            ).toBe(true);
    });

    it('Typography keeps the props of a custom `as` component', () => {
        const Custom = vi.fn((p: Record<string, unknown>) => (
            <span data-weight={String(p['fontWeight'])} />
        ));
        const props = { as: Custom, fontWeight: 600 };
        const { container } = render(<Typography {...props} />);
        expect(container.querySelector('[data-weight="600"]')).not.toBeNull();
    });
});
