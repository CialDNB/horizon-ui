import { describe, expect, it } from 'vitest';
import { anchorGuard } from './anchorGuard';

describe('anchorGuard', () => {
    it('keeps the rest colour and no underline on hover and touch hover by default', () => {
        expect(anchorGuard('primary-foreground').split(' ').sort()).toEqual(
            [
                'hz:hover:text-primary-foreground',
                'hz:hover:no-underline',
                'hz:touch-hover:text-primary-foreground',
                'hz:touch-hover:no-underline',
            ].sort()
        );
    });

    it('uses a distinct hover colour on pointer hover only', () => {
        expect(
            anchorGuard('foreground', { hover: 'accent-foreground' })
                .split(' ')
                .sort()
        ).toEqual(
            [
                'hz:hover:text-accent-foreground',
                'hz:hover:no-underline',
                'hz:touch-hover:text-foreground',
                'hz:touch-hover:no-underline',
            ].sort()
        );
    });

    it('underlines on hover only (tertiary) or always (link)', () => {
        expect(anchorGuard('primary', { hoverUnderline: true })).toContain(
            'hz:hover:underline'
        );
        expect(anchorGuard('primary', { hoverUnderline: true })).toContain(
            'hz:touch-hover:no-underline'
        );
        const link = anchorGuard('primary', { underline: true }).split(' ');
        expect(link).toContain('hz:hover:underline');
        expect(link).toContain('hz:touch-hover:underline');
        expect(link).not.toContain('hz:hover:no-underline');
    });

    it('produces the Button classes per variant', () => {
        expect({
            primary: anchorGuard('primary-foreground'),
            secondary: anchorGuard('primary', { hover: 'primary-foreground' }),
            tertiary: anchorGuard('primary', { hoverUnderline: true }),
            destructive: anchorGuard('destructive-foreground'),
            ghost: anchorGuard('foreground', { hover: 'accent-foreground' }),
            link: anchorGuard('primary', { underline: true }),
        }).toEqual({
            primary:
                'hz:hover:text-primary-foreground hz:touch-hover:text-primary-foreground hz:hover:no-underline hz:touch-hover:no-underline',
            secondary:
                'hz:hover:text-primary-foreground hz:touch-hover:text-primary hz:hover:no-underline hz:touch-hover:no-underline',
            tertiary:
                'hz:hover:text-primary hz:touch-hover:text-primary hz:hover:underline hz:touch-hover:no-underline',
            destructive:
                'hz:hover:text-destructive-foreground hz:touch-hover:text-destructive-foreground hz:hover:no-underline hz:touch-hover:no-underline',
            ghost: 'hz:hover:text-accent-foreground hz:touch-hover:text-foreground hz:hover:no-underline hz:touch-hover:no-underline',
            link: 'hz:hover:text-primary hz:touch-hover:text-primary hz:hover:underline hz:touch-hover:underline',
        });
    });
});
