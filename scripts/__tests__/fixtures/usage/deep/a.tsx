import type { TableColumnSettings } from '@cialdnb/x-core/components/Table/Table.types';
import { useDialog } from '@cialdnb/x-core/components/Dialog/useDialog';
import NumberInputV2 from '@cialdnb/x-core/components/inputs/NumberInputV2';
import { ChartsLegendMensurable } from '@cialdnb/x-core/components/shared/chartsLegendMensurable/ChartsLegendMensurable';
import { borderRadius } from '@cialdnb/x-core/theme/tokens/borderRadius';
import { InfoIcon, BuildingIcon } from '@cialdnb/x-core/icons';

export const A = [
    useDialog,
    NumberInputV2,
    ChartsLegendMensurable,
    borderRadius,
    InfoIcon,
    BuildingIcon,
];
export type T = TableColumnSettings;
