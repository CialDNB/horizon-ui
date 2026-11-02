import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { typography as typographyTokens } from '../../tokens';
import { Typography, typographyVariants, type TypographyVariant } from '.';

const roles = Object.keys(typographyTokens.typeScale) as TypographyVariant[];

describe('Typography', () => {
    it('defaults to body/default rendered as a paragraph', () => {
        render(<Typography>Body copy</Typography>);
        const el = screen.getByText('Body copy');
        expect(el.tagName).toBe('P');
        expect(el).toHaveClass('hz:text-body-default');
        expect(el).toHaveAttribute('data-variant', 'body/default');
    });

    it.each([
        ['display/xl', 'P'],
        ['display/lg', 'P'],
        ['heading/xl', 'H1'],
        ['heading/lg', 'H2'],
        ['heading/md', 'H3'],
        ['heading/sm', 'H4'],
        ['body/lg', 'P'],
        ['body/default', 'P'],
        ['body/secondary', 'P'],
        ['caption', 'SPAN'],
        ['micro', 'SPAN'],
        ['label/sm', 'SPAN'],
        ['label/md', 'SPAN'],
        ['label/lg', 'SPAN'],
    ] as const)('%s renders a semantic <%s> by default', (variant, tag) => {
        render(<Typography variant={variant}>Text</Typography>);
        expect(screen.getByText('Text').tagName).toBe(tag);
    });

    it('covers every type-scale role', () => {
        expect(roles).toHaveLength(14);
        for (const role of roles)
            expect(typographyVariants({ variant: role })).toMatch(
                new RegExp(`hz:(tablet:)?text-${role.replace('/', '-')}( |$)`)
            );
    });

    it('headings expose the heading role and level', () => {
        render(<Typography variant="heading/md">Section</Typography>);
        expect(
            screen.getByRole('heading', { level: 3, name: 'Section' })
        ).toBeInTheDocument();
    });

    it('`as` overrides the element without changing the look', () => {
        render(
            <Typography variant="heading/sm" as="span">
                Inline heading look
            </Typography>
        );
        const el = screen.getByText('Inline heading look');
        expect(el.tagName).toBe('SPAN');
        expect(el).toHaveClass('hz:text-heading-sm');
        expect(screen.queryByRole('heading')).toBeNull();
    });

    it('`as` accepts a component', () => {
        function Custom(props: { className?: string; children?: string }) {
            return <mark {...props} />;
        }
        render(<Typography as={Custom}>Marked</Typography>);
        const el = screen.getByText('Marked');
        expect(el.tagName).toBe('MARK');
        expect(el).toHaveClass('hz:text-body-default');
    });

    it('sets margin, colour and alignment explicitly so host element rules cannot leak in', () => {
        render(<Typography variant="heading/xl">Title</Typography>);
        const el = screen.getByRole('heading');
        expect(el).toHaveClass('hz:m-0', 'hz:text-inherit');
    });

    it('inherits colour by default (x-core/MUI parity) through an explicit class', () => {
        render(<Typography>Inherited</Typography>);
        const el = screen.getByText('Inherited');
        expect(el).toHaveClass('hz:text-inherit');
        expect(el).not.toHaveClass('hz:text-foreground');
    });

    it.each([
        ['foreground', 'hz:text-foreground'],
        ['muted-foreground', 'hz:text-muted-foreground'],
        ['primary', 'hz:text-primary'],
        ['primary-foreground', 'hz:text-primary-foreground'],
        ['neutral-strong', 'hz:text-neutral-strong'],
        ['info-strong', 'hz:text-info-strong'],
        ['success-strong', 'hz:text-success-strong'],
        ['warning-strong', 'hz:text-warning-strong'],
        ['destructive-strong', 'hz:text-destructive-strong'],
        ['inherit', 'hz:text-inherit'],
    ] as const)('color=%s maps to the semantic token', (color, cls) => {
        render(<Typography color={color}>Coloured</Typography>);
        expect(screen.getByText('Coloured')).toHaveClass(cls);
    });

    it('weight and align map to token utilities', () => {
        render(
            <Typography weight="semibold" align="end">
                Aligned
            </Typography>
        );
        expect(screen.getByText('Aligned')).toHaveClass(
            'hz:font-semibold',
            'hz:text-end'
        );
    });

    it('truncate (true) clips to one line, a number clamps to that many lines', () => {
        render(
            <>
                <Typography truncate>One line</Typography>
                <Typography truncate={3}>Three lines</Typography>
            </>
        );
        expect(screen.getByText('One line')).toHaveClass('hz:truncate');
        expect(screen.getByText('Three lines')).toHaveClass('hz:line-clamp-3');
        expect(screen.getByText('Three lines')).not.toHaveClass('hz:truncate');
    });

    it('forwards ref, data-did and native attributes', () => {
        const ref = createRef<HTMLParagraphElement>();
        render(
            <Typography ref={ref} data-did="page-title" id="title" lang="en">
                Title
            </Typography>
        );
        const el = screen.getByText('Title');
        expect(ref.current).toBe(el);
        expect(el).toHaveAttribute('data-did', 'page-title');
        expect(el).toHaveAttribute('id', 'title');
    });

    it('merges className last', () => {
        render(<Typography className="hz:text-caption">Small</Typography>);
        const el = screen.getByText('Small');
        expect(el).toHaveClass('hz:text-caption');
        expect(el).not.toHaveClass('hz:text-body-default');
    });

    it('renders without HorizonProvider and has a displayName', () => {
        render(<Typography>Standalone</Typography>);
        expect(screen.getByText('Standalone')).toBeVisible();
        expect(Typography.displayName).toBe('Typography');
    });

    describe('old x-core values from untyped callers', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it('MUI variant="h5" renders body/default as a paragraph without throwing and warns once', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            render(
                <Typography variant={'h5' as never}>Old heading</Typography>
            );
            const el = screen.getByText('Old heading');
            expect(el.tagName).toBe('P');
            expect(el).toHaveAttribute('data-variant', 'body/default');
            expect(el).toHaveClass('hz:text-body-default');
            expect(warn).toHaveBeenCalledOnce();
            expect(warn.mock.calls[0]?.[0]).toContain('variant "h5"');
        });
    });
});
