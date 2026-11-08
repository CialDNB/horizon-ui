import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { FormField } from '../FormField';
import { EmailsField, type EmailsFieldProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

const box = () => screen.getByRole('textbox');

function Controlled(props: Partial<EmailsFieldProps>) {
    const [emails, setEmails] = useState<string[]>([...(props.value ?? [])]);
    return (
        <EmailsField
            aria-label="Recipients"
            {...props}
            value={emails}
            onValueChange={(next) => {
                setEmails(next);
                props.onValueChange?.(next);
            }}
        />
    );
}

const paste = (text: string) =>
    fireEvent.paste(box(), { clipboardData: { getData: () => text } });

describe('EmailsField', () => {
    it.each(['{Enter}', ',', ';', ' '])(
        'adds a valid address on %s and clears the input',
        async (key) => {
            const user = userEvent.setup();
            const onValueChange = vi.fn();
            render(<Controlled onValueChange={onValueChange} />);
            await user.type(box(), `dana@example.com${key}`);
            expect(onValueChange).toHaveBeenLastCalledWith([
                'dana@example.com',
            ]);
            expect(box()).toHaveValue('');
            expect(
                screen.getByRole('button', { name: 'Remove dana@example.com' })
            ).toBeVisible();
        }
    );

    it('normalizes before validating ("Name <email>", case)', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Controlled onValueChange={onValueChange} />);
        await user.type(box(), 'Dana <Dana@Example.com>{Enter}');
        expect(onValueChange).toHaveBeenLastCalledWith(['dana@example.com']);
    });

    it('keeps an invalid address in the input with an announced error tied to it', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Controlled onValueChange={onValueChange} />);
        await user.type(box(), 'not-an-email{Enter}');
        expect(onValueChange).not.toHaveBeenCalled();
        expect(box()).toHaveValue('not-an-email');
        expect(box()).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Enter a valid email address'
        );
        expect(box()).toHaveAccessibleDescription(
            'Enter a valid email address'
        );
        await user.type(box(), 'x');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('adds on blur; Enter on an empty input is left to the form', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        const onSubmit = vi.fn((e: Event) => e.preventDefault());
        render(
            <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
                <Controlled onValueChange={onValueChange} />
            </form>
        );
        await user.type(box(), 'a@b.co');
        await user.tab();
        expect(onValueChange).toHaveBeenLastCalledWith(['a@b.co']);
        box().focus();
        await user.keyboard('{Enter}');
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('paste splits lists, keeps valid ones, skips duplicates', async () => {
        const onValueChange = vi.fn();
        render(<Controlled value={['a@b.co']} onValueChange={onValueChange} />);
        paste('a@b.co, c@d.com; bad, Eve <eve@x.org>\nf@g.io');
        expect(onValueChange).toHaveBeenLastCalledWith([
            'a@b.co',
            'c@d.com',
            'eve@x.org',
            'f@g.io',
        ]);
        // The invalid part is kept in the input with the error, not dropped.
        expect(box()).toHaveValue('bad');
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Enter a valid email address'
        );
        expect(screen.getByRole('status')).toHaveTextContent('3 added');
    });

    it('paste with nothing valid lands in the input', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Controlled onValueChange={onValueChange} />);
        box().focus();
        await user.paste('half-typed');
        expect(onValueChange).not.toHaveBeenCalled();
        expect(box()).toHaveValue('half-typed');
    });

    it('ignores duplicates; Backspace on the empty input removes the last chip', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <Controlled
                value={['a@b.co', 'c@d.com']}
                onValueChange={onValueChange}
            />
        );
        await user.type(box(), 'A@B.co{Enter}');
        expect(onValueChange).not.toHaveBeenCalled();
        await user.keyboard('{Backspace}');
        expect(onValueChange).toHaveBeenLastCalledWith(['a@b.co']);
    });

    it('limit: counter, and no more additions once full (typed or pasted)', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <Controlled
                limit={2}
                value={['a@b.co']}
                onValueChange={onValueChange}
            />
        );
        expect(box()).toHaveAccessibleDescription('1 / 2');
        paste('c@d.com, e@f.com');
        expect(onValueChange).toHaveBeenLastCalledWith(['a@b.co', 'c@d.com']);
        expect(screen.getByText('2 / 2')).toBeVisible();
        expect(box()).toHaveAttribute('readonly');
        await user.click(
            screen.getByRole('button', { name: 'Remove c@d.com' })
        );
        expect(box()).not.toHaveAttribute('readonly');
    });

    it('custom validate (x-core emailValidationFunc)', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <Controlled
                validate={(e) => e.endsWith('@corp.com')}
                onValueChange={onValueChange}
            />
        );
        await user.type(box(), 'a@gmail.com{Enter}');
        expect(onValueChange).not.toHaveBeenCalled();
        await user.clear(box());
        await user.type(box(), 'a@corp.com{Enter}');
        expect(onValueChange).toHaveBeenLastCalledWith(['a@corp.com']);
    });

    it('clearable removes everything and refocuses', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <Controlled
                clearable
                value={['a@b.co']}
                onValueChange={onValueChange}
            />
        );
        await user.click(screen.getByRole('button', { name: 'Clear all' }));
        expect(onValueChange).toHaveBeenLastCalledWith([]);
        expect(box()).toHaveFocus();
    });

    it('inside a FormField: label, error and description', () => {
        render(
            <FormField
                label="Recipients"
                description="Work addresses"
                error="Add one"
            >
                <EmailsField />
            </FormField>
        );
        const input = screen.getByRole('textbox', { name: 'Recipients' });
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription('Work addresses Add one');
    });

    it('submits every address under name', () => {
        render(
            <form id="f">
                <EmailsField
                    aria-label="To"
                    name="to"
                    defaultValue={['a@b.co', 'c@d.com']}
                />
            </form>
        );
        const data = new FormData(
            document.getElementById('f') as HTMLFormElement
        );
        expect(data.getAll('to')).toEqual(['a@b.co', 'c@d.com']);
    });

    it('forwards ref and data-did to the input; drops x-core props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ref = createRef<HTMLInputElement>();
        const legacy = { emailValidationFunc: () => true, labelContainer: 'X' };
        render(
            <EmailsField
                aria-label="To"
                ref={ref}
                data-did="to"
                {...(legacy as object)}
            />
        );
        expect(ref.current).toBe(box());
        expect(box()).toHaveAttribute('data-did', 'to');
        expect([...box().attributes].map((a) => a.name)).not.toContain(
            'emailvalidationfunc'
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('emailValidationFunc')
        );
    });

    it('announces additions and removals in the polite status region', async () => {
        const user = userEvent.setup();
        render(<Controlled value={['a@b.co']} />);
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('');
        await user.type(box(), 'c@d.com{Enter}');
        expect(status).toHaveTextContent('c@d.com added');
        await user.click(screen.getByRole('button', { name: 'Remove a@b.co' }));
        expect(status).toHaveTextContent('a@b.co removed');
        await user.keyboard('{Backspace}');
        expect(status).toHaveTextContent('c@d.com removed');
    });
});
