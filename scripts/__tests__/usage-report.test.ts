import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    buildReport,
    collectUsage,
    groupFamilies,
    type ReportRow,
} from '../usage-report';

const fixture = (name: string) => join(__dirname, 'fixtures', 'usage', name);
const report = (name: string) => buildReport(collectUsage(fixture(name)));
const row = (rows: ReportRow[], name: string) =>
    rows.find((r) => r.name === name);

describe('usage-report', () => {
    it('counts named imports from @cialdnb/x-core', () => {
        const { components } = report('basic');
        expect(row(components, 'Card')).toMatchObject({ count: 2, files: 2 });
        expect(row(components, 'Chip')).toMatchObject({ count: 1, files: 1 });
        expect(components.map((r) => r.name)).toEqual(['Card', 'Chip']);
    });

    it('counts aliased and default-namespace imports', () => {
        const { components, other } = report('aliases');
        expect(row(components, 'Chip')).toMatchObject({
            count: 2,
            files: 2,
            kinds: { named: 2 },
        });
        expect(row(components, 'Card')).toMatchObject({
            count: 1,
            kinds: { default: 1 },
        });
        expect(row(components, 'Typography')).toMatchObject({
            count: 1,
            kinds: { namespace: 1 },
        });
        expect(row(other, '@cialdnb/x-core/components')).toMatchObject({
            count: 1,
            kinds: { namespace: 1 },
        });
        expect(row(other, '@cialdnb/x-core')).toMatchObject({
            count: 1,
            kinds: { default: 1 },
        });
    });

    it('ignores other packages', () => {
        const { components, other } = report('other');
        expect(components.map((r) => r.name)).toEqual(['Card']);
        expect(other).toEqual([]);
    });

    it('attributes deep paths to the owning component', () => {
        const { components, other } = report('deep');
        expect(components.map((r) => r.name).sort()).toEqual([
            'Dialog',
            'NumberInputV2',
            'Table',
        ]);
        expect(row(other, '@cialdnb/x-core/icons')).toMatchObject({
            count: 2,
            imports: { InfoIcon: 1, BuildingIcon: 1 },
        });
        expect(
            row(other, '@cialdnb/x-core/theme/tokens/borderRadius')
        ).toMatchObject({ count: 1 });
        expect(
            row(
                other,
                '@cialdnb/x-core/components/shared/chartsLegendMensurable/ChartsLegendMensurable'
            )
        ).toMatchObject({ count: 1 });
    });

    it('resolves barrel names through an owner map', () => {
        const owners = new Map([['TableColumnSettings', 'Table']]);
        const records = collectUsage(fixture('deep'), { owners });
        expect(records.filter((r) => r.owner === 'Table')).toHaveLength(1);
        const barrel = buildReport(
            [
                {
                    specifier: '@cialdnb/x-core/components',
                    imported: 'TableColumnSettings',
                    kind: 'named',
                    file: 'x.ts',
                    owner: owners.get('TableColumnSettings') ?? null,
                },
            ],
            []
        );
        expect(barrel.components[0]?.name).toBe('Table');
    });

    it('counts re-exports and dynamic imports', () => {
        const { components, other } = report('reexport-dynamic');
        expect(row(components, 'Card')).toMatchObject({
            count: 1,
            kinds: { reexport: 1 },
        });
        expect(row(components, 'Avatar')).toMatchObject({
            kinds: { reexport: 1 },
        });
        expect(row(components, 'Chip')).toMatchObject({
            kinds: { dynamic: 1 },
        });
        expect(row(other, '@cialdnb/x-core/components')).toMatchObject({
            kinds: { dynamic: 1 },
        });
    });

    it('groups version families and marks only the highest version todo', () => {
        const { components } = report('families');
        const by = (n: string) => row(components, n);
        expect(by('Button')).toMatchObject({
            status: 'superseded',
            horizon: 'Button',
        });
        expect(by('ButtonV2')).toMatchObject({
            status: 'todo',
            horizon: 'Button',
        });
        expect(by('Select')?.status).toBe('superseded');
        expect(by('SelectV2')?.status).toBe('todo');
        expect(by('Radiov2')).toMatchObject({
            status: 'todo',
            horizon: 'Radio',
        });
        expect(by('TabsV2')).toMatchObject({ status: 'todo', horizon: 'Tabs' });
        expect(by('Button')?.familyCount).toBe(2);
        expect(groupFamilies(['Foo', 'FooV2', 'FooV3']).get('FooV2')).toEqual({
            horizon: 'Foo',
            status: 'superseded',
        });
    });

    it('Drawer family is the exception', () => {
        const { components } = report('drawer');
        expect(row(components, 'DrawerV2')).toMatchObject({
            status: 'todo',
            horizon: 'NavigationDrawer',
        });
        expect(row(components, 'DrawerV3')).toMatchObject({
            status: 'todo',
            horizon: 'Drawer',
        });
        expect(row(components, 'Drawer')?.status).toBe('superseded');
    });
});
