import { render, renderHook } from '@testing-library/react';
import { createRef, useRef, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { composeRefs } from './composeRefs';
import {
    FormFieldContext,
    useFieldControl,
    type FormFieldContextValue,
} from './formField';
import { useResolvedDir } from './useResolvedDir';

const field: FormFieldContextValue = {
    id: 'f-id',
    labelId: 'f-label',
    describedBy: 'f-desc f-err',
    invalid: true,
    required: true,
    disabled: false,
};
const inField = ({ children }: { children: ReactNode }) => (
    <FormFieldContext.Provider value={field}>
        {children}
    </FormFieldContext.Provider>
);

describe('useFieldControl', () => {
    it('passes props through outside a FormField', () => {
        const { result } = renderHook(() =>
            useFieldControl({ id: 'own', 'aria-describedby': 'hint' })
        );
        expect(result.current).toEqual({
            id: 'own',
            'aria-describedby': 'hint',
            invalid: false,
            required: false,
            disabled: false,
        });
    });

    it('takes the FormField wiring and lets own props win', () => {
        const { result } = renderHook(() => useFieldControl({}), {
            wrapper: inField,
        });
        expect(result.current).toEqual({
            id: 'f-id',
            'aria-describedby': 'f-desc f-err',
            invalid: true,
            required: true,
            disabled: false,
        });
        const own = renderHook(
            () =>
                useFieldControl({
                    id: 'own',
                    'aria-describedby': 'hint',
                    invalid: false,
                    disabled: true,
                }),
            { wrapper: inField }
        );
        expect(own.result.current).toEqual({
            id: 'own',
            'aria-describedby': 'hint f-desc f-err',
            invalid: false,
            required: true,
            disabled: true,
        });
    });
});

describe('composeRefs', () => {
    it('assigns object and callback refs', () => {
        const object = createRef<HTMLDivElement>();
        const calls: (HTMLDivElement | null)[] = [];
        const { unmount } = render(
            <div
                ref={composeRefs(
                    object,
                    (n) => {
                        calls.push(n);
                    },
                    undefined
                )}
            />
        );
        expect(object.current).toBeInstanceOf(HTMLDivElement);
        expect(calls[0]).toBe(object.current);
        unmount();
        expect(object.current).toBeNull();
    });
});

function Dir({ dir }: { dir?: 'ltr' | 'rtl' }) {
    const ref = useRef<HTMLSpanElement>(null);
    return (
        <span ref={ref} data-testid="d">
            {useResolvedDir(ref, dir)}
        </span>
    );
}

describe('useResolvedDir', () => {
    it('reads the direction from a dir ancestor, or uses the prop', () => {
        const { getByTestId, rerender } = render(
            <div dir="rtl">
                <Dir />
            </div>
        );
        expect(getByTestId('d').textContent).toBe('rtl');
        rerender(
            <div dir="rtl">
                <Dir dir="ltr" />
            </div>
        );
        expect(getByTestId('d').textContent).toBe('ltr');
        rerender(<Dir />);
        expect(getByTestId('d').textContent).toBe('ltr');
    });
});
