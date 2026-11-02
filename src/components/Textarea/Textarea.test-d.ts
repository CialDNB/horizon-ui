import type { ComponentRef } from 'react';
import type { Textarea, TextareaProps } from '.';

export const full: TextareaProps = {
    rows: 3,
    invalid: true,
    resize: 'none',
    autoResize: true,
    maxRows: 8,
    'aria-label': 'Comment',
    'data-did': 'comment',
};

export const ref: ComponentRef<typeof Textarea> | null =
    null as HTMLTextAreaElement | null;

export const resizeBoth: TextareaProps = {
    // @ts-expect-error only vertical or none
    resize: 'both',
};

export const minRows: TextareaProps = {
    // @ts-expect-error x-core minRows is rows
    minRows: 3,
};
