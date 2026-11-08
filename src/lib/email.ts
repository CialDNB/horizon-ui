/*
 * Port of x-core `utils/emailValidation.ts` and `utils/emailSanitizer.ts`
 * (x-core 2.2.30), unchanged in behaviour: customer360 imports
 * `validateEmail` from '@cialdnb/x-core/utils/emailValidation'.
 */

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/** True when `email` (trimmed) looks like an address (x-core rule). */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
}

/**
 * Removes invisible/control and non-ASCII characters (copy-paste debris),
 * keeps only address characters, trims and lowercases.
 */
export function sanitizeEmail(email: string | null | undefined): string {
    if (!email || typeof email !== 'string') return '';
    return (
        email
            .normalize('NFKD')
            .replace(/[\p{C}]/gu, '')
            // eslint-disable-next-line no-control-regex -- strip non-ASCII, as x-core
            .replace(/[^\x00-\x7F]/g, '')
            .replace(/[^a-zA-Z0-9._%+\-@]/g, '')
            .trim()
            .toLowerCase()
    );
}

/** Typed or pasted text to an address: handles "Name <email>", then sanitizes. */
export function normalizeEmailInput(raw: string): string {
    const match = raw.match(/<([^>]+)>/);
    return sanitizeEmail(match ? match[1] : raw);
}
