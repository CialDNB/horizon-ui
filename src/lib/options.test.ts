import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    omitLegacyProps,
    resetWarnings,
    resolveOption,
    warnOnce,
} from './options';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('resolveOption', () => {
    it('keeps an accepted value and maps undefined to the fallback silently', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(resolveOption('X', 'size', 'sm', ['sm', 'md'], 'md')).toBe('sm');
        expect(resolveOption('X', 'size', undefined, ['sm', 'md'], 'md')).toBe(
            'md'
        );
        expect(warn).not.toHaveBeenCalled();
    });

    it('falls back on an unknown value and warns once naming value and options', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        for (let i = 0; i < 3; i++)
            expect(
                resolveOption('X', 'size', 'small', ['sm', 'md'], 'md')
            ).toBe('md');
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0]?.[0]).toBe(
            '[horizon-ui] X: unknown size "small"; using "md". Accepted: "sm", "md".'
        );
    });

    it('is silent in production builds', () => {
        vi.stubEnv('NODE_ENV', 'production');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        warnOnce('prod');
        expect(warn).not.toHaveBeenCalled();
        vi.unstubAllEnvs();
    });
});

describe('omitLegacyProps', () => {
    const legacy = {
        sx: 'use className',
        startIcon: 'pass the icon as children',
    };

    it('returns the same object when no legacy prop is present, silently', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const props = { id: 'a', title: 'b' };
        expect(omitLegacyProps('X', props, legacy)).toBe(props);
        expect(warn).not.toHaveBeenCalled();
    });

    it('drops present legacy props (even undefined ones) and warns once per prop', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const props = { id: 'a', sx: { p: 1 }, startIcon: undefined };
        for (let i = 0; i < 2; i++)
            expect(omitLegacyProps('X', props, legacy)).toEqual({ id: 'a' });
        expect(props).toHaveProperty('sx');
        expect(warn).toHaveBeenCalledTimes(2);
        expect(warn.mock.calls[0]?.[0]).toBe(
            '[horizon-ui] X: x-core prop "sx" is not supported and was ignored (use className).'
        );
    });
});
