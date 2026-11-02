import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { Textarea, textareaVariants } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('Textarea', () => {
    it('is a native multi-line textbox, 4 rows, resizable vertically', () => {
        render(<Textarea aria-label="Comment" />);
        const box = screen.getByRole('textbox', { name: 'Comment' });
        expect(box.tagName).toBe('TEXTAREA');
        expect(box).toHaveAttribute('rows', '4');
        expect(box).toHaveAttribute('data-resize', 'vertical');
        expect(box.className).toContain('hz:resize-y');
    });

    it('invalid, required and describedby reach the textarea', () => {
        render(
            <Textarea
                aria-label="Comment"
                invalid
                required
                aria-describedby="hint"
            />
        );
        const box = screen.getByRole('textbox');
        expect(box).toHaveAttribute('aria-invalid', 'true');
        expect(box).toBeRequired();
        expect(box).toHaveAttribute('aria-describedby', 'hint');
        expect(box.className).toContain('hz:ring-destructive');
    });

    it('disabled is not focusable and muted', async () => {
        const user = userEvent.setup();
        render(<Textarea aria-label="Comment" disabled />);
        await user.tab();
        const box = screen.getByRole('textbox');
        expect(box).not.toHaveFocus();
        expect(box.className).toContain('hz:bg-muted');
    });

    it('resize="none" and autoResize turn the handle off', () => {
        render(
            <>
                <Textarea aria-label="A" resize="none" />
                <Textarea aria-label="B" autoResize />
            </>
        );
        expect(screen.getByLabelText('A').className).toContain(
            'hz:resize-none'
        );
        expect(screen.getByLabelText('B')).toHaveAttribute(
            'data-resize',
            'none'
        );
    });

    it('autoResize grows to the content height, capped by maxRows', async () => {
        const user = userEvent.setup();
        render(<Textarea aria-label="Grow" autoResize maxRows={6} />);
        const box = screen.getByRole<HTMLTextAreaElement>('textbox');
        // jsdom has no layout: fake the content height and line metrics.
        let scrollHeight = 64;
        Object.defineProperty(box, 'scrollHeight', {
            get: () => scrollHeight,
        });
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            lineHeight: '20px',
            paddingTop: '12px',
            paddingBottom: '12px',
        } as CSSStyleDeclaration);
        await user.type(box, 'a');
        expect(box.style.height).toBe('64px');
        scrollHeight = 400;
        await user.type(box, 'b');
        // 6 rows x 20px + 24px padding.
        expect(box.style.height).toBe('144px');
        expect(box.style.overflowY).toBe('auto');
    });

    it('forwards ref, className and data-did to the textarea', () => {
        const ref = createRef<HTMLTextAreaElement>();
        render(
            <Textarea
                ref={ref}
                aria-label="C"
                className="custom"
                data-did="c"
            />
        );
        const box = screen.getByRole('textbox');
        expect(ref.current).toBe(box);
        expect(box).toHaveClass('custom');
        expect(box).toHaveAttribute('data-did', 'c');
        expect(textareaVariants({ state: 'invalid' })).toContain(
            'hz:ring-destructive'
        );
    });

    it('falls back to vertical with a warning for an unknown resize', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Textarea as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(<Untyped aria-label="R" resize="both" />);
        expect(screen.getByRole('textbox')).toHaveAttribute(
            'data-resize',
            'vertical'
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('unknown resize "both"')
        );
    });

    it('drops x-core TextArea props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Textarea as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped
                aria-label="Legacy"
                label="Comment"
                helperText="Help"
                error
                fullWidth
                multiline
                minRows={3}
                isLabelContainer
                characterLimit={200}
                inputProps={{ maxLength: 2 }}
            />
        );
        const box = screen.getByRole('textbox');
        for (const attr of ['label', 'error', 'fullwidth', 'multiline'])
            expect(box).not.toHaveAttribute(attr);
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "minRows"')
        );
    });
});
