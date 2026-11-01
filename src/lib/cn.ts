import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import {
    borderRadius,
    breakpoints,
    duration,
    easing,
    elevation,
    typography,
} from '../tokens';

const typeRoles = Object.keys(typography.typeScale).map((role) =>
    role.replace('/', '-')
);

const kebab = (key: string) =>
    key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const keys = (scale: object) => Object.keys(scale);

const twMerge = extendTailwindMerge({
    prefix: 'hz',
    extend: {
        theme: {
            shadow: keys(elevation),
            radius: keys(borderRadius),
            breakpoint: keys(breakpoints).filter((key) => key !== 'mobile'),
            ease: keys(easing),
            'font-weight': keys(typography.fontWeight).map(kebab),
        },
        classGroups: {
            // Without this the type-scale utilities are read as text colours.
            'font-size': [{ text: typeRoles }],
            duration: [{ duration: keys(duration) }],
        },
    },
});

/**
 * Joins class names (clsx syntax) and resolves conflicting `hz:`-prefixed
 * Tailwind utilities, the last one winning. Un-prefixed classes pass through
 * untouched (ADR 0001).
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
