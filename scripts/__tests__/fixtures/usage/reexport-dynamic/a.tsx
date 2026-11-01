import { lazy } from 'react';

export { Card } from '@cialdnb/x-core/components';
export * from '@cialdnb/x-core/components/Avatar';

export const Chip = lazy(() => import('@cialdnb/x-core/components/Chip'));
export const Lazy = () => import('@cialdnb/x-core/components');
