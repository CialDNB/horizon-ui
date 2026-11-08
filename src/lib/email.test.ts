import { describe, expect, it } from 'vitest';
import { normalizeEmailInput, sanitizeEmail, validateEmail } from './email';

// Same cases as x-core utils/emailValidation.ts and utils/emailSanitizer.ts
// (x-core 2.2.30); behaviour must match because customer360 imports
// validateEmail from '@cialdnb/x-core/utils/emailValidation' in 2 files.
describe('validateEmail (x-core port)', () => {
    it.each([
        'a@b.co',
        'first.last+tag@sub.example.com',
        'UPPER@EXAMPLE.ORG',
        'x_y-z%1@domain-name.io',
        '  padded@example.com  ',
    ])('accepts %s', (email) => expect(validateEmail(email)).toBe(true));

    it.each([
        '',
        'plain',
        'no-at.example.com',
        'a@b',
        'a@b.c',
        'a b@example.com',
        'a@exa mple.com',
        '@example.com',
        'a@.com',
    ])('rejects %j', (email) => expect(validateEmail(email)).toBe(false));

    it('rejects non-strings (plain-JS callers)', () => {
        expect(validateEmail(undefined as unknown as string)).toBe(false);
        expect(validateEmail(42 as unknown as string)).toBe(false);
    });
});

describe('sanitizeEmail / normalizeEmailInput (x-core port)', () => {
    it('removes invisible and non-ASCII characters and lowercases', () => {
        expect(sanitizeEmail('Jo​hn@Exámple.com ')).toBe('john@example.com');
        expect(sanitizeEmail(null)).toBe('');
    });

    it('takes the address out of "Name <email>"', () => {
        expect(normalizeEmailInput('Dana Levi <Dana@Example.com>')).toBe(
            'dana@example.com'
        );
        expect(normalizeEmailInput('dana@example.com')).toBe(
            'dana@example.com'
        );
    });
});
