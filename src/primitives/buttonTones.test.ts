import { describe, expect, it } from 'vitest';
import { anchorGuard } from './anchorGuard';
import { buttonTones } from './buttonTones';

describe('buttonTones', () => {
    it('pairs every tone surface with its anchorGuard states', () => {
        expect(buttonTones.primary).toContain('hz:bg-primary ');
        expect(buttonTones.primary).toContain(
            anchorGuard('primary-foreground')
        );
        expect(buttonTones.ghost).toContain(
            anchorGuard('foreground', { hover: 'accent-foreground' })
        );
        expect(Object.keys(buttonTones)).toEqual([
            'primary',
            'secondary',
            'destructive',
            'ghost',
        ]);
    });
});
