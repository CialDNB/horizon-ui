import { describe, expect, it, vi } from 'vitest';
import { blockedClick } from './blockedClick';

const event = () => ({ preventDefault: vi.fn() });

describe('blockedClick', () => {
    it('calls onClick when not blocked', () => {
        const onClick = vi.fn();
        const e = event();
        blockedClick(false, onClick)(e);
        expect(onClick).toHaveBeenCalledWith(e);
        expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it('prevents the default action and skips onClick when blocked', () => {
        const onClick = vi.fn();
        const e = event();
        blockedClick(true, onClick)(e);
        expect(onClick).not.toHaveBeenCalled();
        expect(e.preventDefault).toHaveBeenCalledOnce();
    });

    it('works without an onClick', () => {
        expect(() => blockedClick(false)(event())).not.toThrow();
        const e = event();
        blockedClick(true)(e);
        expect(e.preventDefault).toHaveBeenCalledOnce();
    });
});
