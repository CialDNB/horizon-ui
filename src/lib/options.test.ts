import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings, resolveOption, warnOnce } from './options';

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
