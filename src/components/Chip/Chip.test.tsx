import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { Chip, chipVariants } from '.';

describe('Chip', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('renders a static label with no interactive role by default', () => {
        render(<Chip label="Active" />);
        expect(screen.getByText('Active')).toBeVisible();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('defaults to primary soft md', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Chip ref={ref} label="Active" />);
        expect(ref.current).toHaveAttribute('data-variant', 'primary');
        expect(ref.current).toHaveAttribute('data-appearance', 'soft');
        expect(ref.current).toHaveAttribute('data-size', 'md');
        expect(ref.current).toHaveClass('hz:bg-accent');
    });

    it.each([
        ['neutral', 'soft', 'hz:bg-neutral-subtle', 'hz:text-neutral-strong'],
        ['primary', 'soft', 'hz:bg-accent', 'hz:text-accent-foreground'],
        ['info', 'soft', 'hz:bg-info-subtle', 'hz:text-info-strong'],
        ['success', 'soft', 'hz:bg-success-subtle', 'hz:text-success-strong'],
        ['warning', 'soft', 'hz:bg-warning-subtle', 'hz:text-warning-strong'],
        [
            'error',
            'soft',
            'hz:bg-destructive-subtle',
            'hz:text-destructive-strong',
        ],
        ['neutral', 'outline', 'hz:ring-input', 'hz:text-neutral-strong'],
        ['success', 'outline', 'hz:ring-success', 'hz:text-success-strong'],
        [
            'error',
            'outline',
            'hz:ring-destructive',
            'hz:text-destructive-strong',
        ],
    ] as const)(
        '%s %s maps to semantic tokens',
        (variant, appearance, surface, text) => {
            const classes = chipVariants({ variant, appearance }).split(' ');
            expect(classes).toContain(surface);
            expect(classes).toContain(text);
        }
    );

    it('with onClick the label is a real button, keyboard operable', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Chip label="Filter: Open" onClick={onClick} />);
        const button = screen.getByRole('button', { name: 'Filter: Open' });
        expect(button).toHaveAttribute('type', 'button');
        await user.tab();
        expect(button).toHaveFocus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('with onDelete renders a remove button named after the label', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        render(<Chip label="Germany" onDelete={onDelete} />);
        const remove = screen.getByRole('button', { name: 'Remove Germany' });
        await user.tab();
        expect(remove).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(onDelete).toHaveBeenCalledTimes(1);
        // The remove icon is decorative; the button carries the name.
        expect(remove.querySelector('svg')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('removeLabel overrides the remove button name (i18n)', () => {
        render(
            <Chip label="ישראל" removeLabel="הסר ישראל" onDelete={vi.fn()} />
        );
        expect(
            screen.getByRole('button', { name: 'הסר ישראל' })
        ).toBeInTheDocument();
    });

    it('clickable and deletable are two separate buttons in tab order', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const onDelete = vi.fn();
        render(<Chip label="Tag" onClick={onClick} onDelete={onDelete} />);
        await user.tab();
        expect(screen.getByRole('button', { name: 'Tag' })).toHaveFocus();
        await user.tab();
        expect(
            screen.getByRole('button', { name: 'Remove Tag' })
        ).toHaveFocus();
        await user.keyboard(' ');
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('Backspace or Delete on the focused chip button removes it', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        render(<Chip label="Tag" onClick={vi.fn()} onDelete={onDelete} />);
        await user.tab();
        await user.keyboard('{Backspace}');
        await user.keyboard('{Delete}');
        expect(onDelete).toHaveBeenCalledTimes(2);
    });

    it('disabled disables both buttons and blocks handlers', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const onDelete = vi.fn();
        const ref = createRef<HTMLSpanElement>();
        render(
            <Chip
                ref={ref}
                label="Tag"
                disabled
                onClick={onClick}
                onDelete={onDelete}
            />
        );
        for (const button of screen.getAllByRole('button')) {
            expect(button).toBeDisabled();
            await user.click(button);
        }
        await user.tab();
        expect(document.body).toHaveFocus();
        expect(onClick).not.toHaveBeenCalled();
        expect(onDelete).not.toHaveBeenCalled();
        expect(ref.current).toHaveAttribute('data-disabled', 'true');
    });

    it('renders a leading icon as decoration', () => {
        render(<Chip label="Verified" icon={<svg data-testid="icon" />} />);
        expect(screen.getByTestId('icon').parentElement).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('sets title to the full label only when the label is truncated', () => {
        let callback: ResizeObserverCallback = () => undefined;
        vi.stubGlobal(
            'ResizeObserver',
            class {
                constructor(cb: ResizeObserverCallback) {
                    callback = cb;
                }
                observe() {}
                unobserve() {}
                disconnect() {}
            }
        );
        const label = 'A very long organisation name that does not fit';
        render(<Chip label={label} />);
        const text = screen.getByText(label);
        expect(text).not.toHaveAttribute('title');
        Object.defineProperty(text, 'scrollWidth', { value: 400 });
        Object.defineProperty(text, 'clientWidth', { value: 120 });
        act(() =>
            callback(
                [{ target: text } as unknown as ResizeObserverEntry],
                {} as ResizeObserver
            )
        );
        expect(text).toHaveAttribute('title', label);
    });

    it('many chips share one ResizeObserver and do not read layout on mount', () => {
        const created = vi.fn();
        const observed: Element[] = [];
        vi.stubGlobal(
            'ResizeObserver',
            class {
                constructor() {
                    created();
                }
                observe(el: Element) {
                    observed.push(el);
                }
                unobserve() {}
                disconnect() {}
            }
        );
        const scrollWidth = vi.spyOn(
            HTMLElement.prototype,
            'scrollWidth',
            'get'
        );
        render(
            <>
                {Array.from({ length: 20 }, (_, i) => (
                    <Chip key={i} label={`Chip ${i}`} />
                ))}
            </>
        );
        expect(created).toHaveBeenCalledTimes(1);
        expect(observed).toHaveLength(20);
        // The first measurement comes from the observer's initial callback.
        expect(scrollWidth).not.toHaveBeenCalled();
    });

    it('forwards ref to the root, data-did and native attributes', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Chip ref={ref} label="Tag" data-did="filter-chip" id="chip-1" />
        );
        expect(ref.current?.tagName).toBe('SPAN');
        expect(ref.current).toHaveAttribute('data-did', 'filter-chip');
        expect(ref.current).toHaveAttribute('id', 'chip-1');
    });

    it('merges className last and has a displayName', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Chip ref={ref} label="Tag" className="hz:rounded-full" />);
        expect(ref.current).toHaveClass('hz:rounded-full');
        expect(ref.current).not.toHaveClass('hz:rounded-xs');
        expect(Chip.displayName).toBe('Chip');
    });

    it('hit layers are hidden from assistive tech and forward clicks to their button', () => {
        const onClick = vi.fn();
        const onDelete = vi.fn();
        const ref = createRef<HTMLSpanElement>();
        render(
            <Chip ref={ref} label="Tag" onClick={onClick} onDelete={onDelete} />
        );
        const layers = ref.current?.querySelectorAll('[data-chip-hit]') ?? [];
        expect(layers).toHaveLength(3);
        for (const layer of Array.from(layers))
            expect(layer).toHaveAttribute('aria-hidden', 'true');
        const [action, removeOuter, removeInner] = Array.from(layers);
        if (!action || !removeOuter || !removeInner) throw new Error('layers');
        fireEvent.click(action);
        expect(onClick).toHaveBeenCalledTimes(1);
        fireEvent.click(removeOuter);
        fireEvent.click(removeInner);
        expect(onDelete).toHaveBeenCalledTimes(2);
    });

    it('inside a clickable parent, each chip click reaches the parent exactly once', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const onDelete = vi.fn();
        const onRow = vi.fn();
        const ref = createRef<HTMLSpanElement>();
        render(
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test fixture: a clickable row
            <div onClick={onRow}>
                <Chip
                    ref={ref}
                    label="Tag"
                    onClick={onClick}
                    onDelete={onDelete}
                />
            </div>
        );
        // The visible button.
        await user.click(screen.getByRole('button', { name: 'Tag' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onRow).toHaveBeenCalledTimes(1);
        // The extended hit layers.
        const [action, removeOuter] = Array.from(
            ref.current?.querySelectorAll('[data-chip-hit]') ?? []
        );
        if (!action || !removeOuter) throw new Error('layers');
        fireEvent.click(action);
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onRow).toHaveBeenCalledTimes(2);
        fireEvent.click(removeOuter);
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onRow).toHaveBeenCalledTimes(3);
    });

    it('native ancestor listeners also see exactly one click per hit-layer click', () => {
        const onClick = vi.fn();
        const ref = createRef<HTMLSpanElement>();
        const { container } = render(
            <Chip ref={ref} label="Tag" onClick={onClick} />
        );
        const native = vi.fn();
        container.addEventListener('click', native);
        const layer = ref.current?.querySelector('[data-chip-hit]');
        if (!layer) throw new Error('no layer');
        fireEvent.click(layer);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(native).toHaveBeenCalledTimes(1);
    });

    it('a click on a hit layer focuses its button, as a native click does', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Chip ref={ref} label="Tag" onClick={vi.fn()} onDelete={vi.fn()} />
        );
        const [action, removeOuter] = Array.from(
            ref.current?.querySelectorAll('[data-chip-hit]') ?? []
        );
        if (!action || !removeOuter) throw new Error('layers');
        fireEvent.click(action);
        expect(screen.getByRole('button', { name: 'Tag' })).toHaveFocus();
        fireEvent.click(removeOuter);
        expect(
            screen.getByRole('button', { name: 'Remove Tag' })
        ).toHaveFocus();
    });

    it('hit layers do nothing while disabled', () => {
        const onClick = vi.fn();
        const ref = createRef<HTMLSpanElement>();
        render(<Chip ref={ref} label="Tag" disabled onClick={onClick} />);
        const layer = ref.current?.querySelector('[data-chip-hit]');
        if (!layer) throw new Error('no layer');
        fireEvent.click(layer);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('a click on the remove button does not trigger onClick', () => {
        const onClick = vi.fn();
        const onDelete = vi.fn();
        render(<Chip label="Tag" onClick={onClick} onDelete={onDelete} />);
        fireEvent.click(screen.getByRole('button', { name: 'Remove Tag' }));
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    describe('old x-core values from untyped callers', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it('size="small" with onClick and onDelete renders md without throwing', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const ref = createRef<HTMLSpanElement>();
            render(
                <Chip
                    ref={ref}
                    label="Tag"
                    size={'small' as never}
                    variant={'outlined' as never}
                    appearance={'filled' as never}
                    onClick={() => undefined}
                    onDelete={() => undefined}
                />
            );
            expect(
                screen.getByRole('button', { name: 'Remove Tag' })
            ).toBeVisible();
            expect(ref.current).toHaveAttribute('data-size', 'md');
            expect(ref.current).toHaveAttribute('data-variant', 'primary');
            expect(ref.current).toHaveAttribute('data-appearance', 'soft');
            expect(warn).toHaveBeenCalledTimes(3);
        });
    });
});
