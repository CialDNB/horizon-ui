import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DateCell, formatCellDate } from '.';

const originalTz = process.env['TZ'];
afterEach(() => {
    process.env['TZ'] = originalTz;
});

describe('DateCell (x-core Cell/Types/date.index)', () => {
    it('renders the row value at column.id as "Mon DD YYYY" in a <time>', () => {
        render(
            <DateCell
                row={{ createdAt: '2026-01-05' }}
                column={{ id: 'createdAt' }}
            />
        );
        const time = screen.getByText('Jan 05 2026');
        expect(time.tagName).toBe('TIME');
        expect(time).toHaveAttribute('datetime', '2026-01-05');
    });

    it('a local date keeps its day in dateTime east of UTC (Asia/Jerusalem)', () => {
        process.env['TZ'] = 'Asia/Jerusalem';
        render(<DateCell row={{ d: '2026-03-01' }} column={{ id: 'd' }} />);
        expect(screen.getByText('Mar 01 2026')).toHaveAttribute(
            'datetime',
            '2026-03-01'
        );
    });

    it('a missing value shows "-"', () => {
        render(<DateCell row={{}} column={{ id: 'createdAt' }} />);
        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('formatCellDate is exported', () => {
        expect(formatCellDate(new Date(2001, 0, 5))).toBe('Jan 05 2001');
    });
});
