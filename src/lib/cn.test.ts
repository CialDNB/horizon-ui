import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
    it('cn merges conflicting prefixed utilities', () => {
        expect(cn('hz:px-2', 'hz:px-4')).toBe('hz:px-4');
        expect(cn('hz:text-body-default', 'hz:text-heading-md')).toBe(
            'hz:text-heading-md'
        );
        expect(cn('hz:shadow-1', 'hz:shadow-2')).toBe('hz:shadow-2');
        expect(cn('hz:rounded-lg', 'hz:rounded-xs')).toBe('hz:rounded-xs');
    });

    it('keeps type-scale size and text colour together', () => {
        expect(cn('hz:text-body-default', 'hz:text-primary')).toBe(
            'hz:text-body-default hz:text-primary'
        );
        expect(cn('hz:text-body-default', 'hz:text-primary-foreground')).toBe(
            'hz:text-body-default hz:text-primary-foreground'
        );
    });

    it('registers every type-scale role as a font-size', () => {
        const roles = [
            'display-xl',
            'display-lg',
            'heading-xl',
            'heading-lg',
            'heading-md',
            'heading-sm',
            'body-lg',
            'body-default',
            'body-secondary',
            'caption',
            'micro',
        ];
        for (const role of roles) {
            expect(cn('hz:text-micro', `hz:text-${role}`)).toBe(
                `hz:text-${role}`
            );
        }
    });

    it('merges variants, and custom scales', () => {
        expect(cn('hz:tablet:px-2', 'hz:tablet:px-4')).toBe('hz:tablet:px-4');
        expect(cn('hz:px-2', 'hz:tablet:px-4')).toBe('hz:px-2 hz:tablet:px-4');
        expect(cn('hz:ease-standard', 'hz:ease-spring')).toBe('hz:ease-spring');
        expect(cn('hz:font-light', 'hz:font-extra-bold')).toBe(
            'hz:font-extra-bold'
        );
    });

    it('handles clsx inputs and passes unprefixed classes through', () => {
        expect(cn('hz:flex', false, undefined, { 'hz:p-2': true })).toBe(
            'hz:flex hz:p-2'
        );
        expect(cn('px-2', 'px-4')).toBe('px-2 px-4');
    });
});
