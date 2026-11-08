import { describe, expect, it } from 'vitest';
import { listItem } from './listItem';

describe('listItem', () => {
    it('is the shared row: 44px/36px rows, accent highlight, forced-colors outline', () => {
        const classes = listItem().split(' ');
        for (const c of [
            'hz:min-h-11',
            'hz:tablet:pointer-fine:min-h-9',
            'hz:data-[highlighted]:bg-accent',
            'hz:forced-colors:data-[highlighted]:outline-[Highlight]',
            'hz:data-[disabled]:text-muted-foreground',
        ])
            expect(classes).toContain(c);
    });

    it('marks disabled by aria-disabled for non-Radix rows', () => {
        const classes = listItem({ disabledBy: 'aria' }).split(' ');
        expect(classes).toContain('hz:aria-disabled:text-muted-foreground');
        expect(classes).not.toContain(
            'hz:data-[disabled]:text-muted-foreground'
        );
    });
});
