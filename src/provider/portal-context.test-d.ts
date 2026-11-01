import { expectTypeOf } from 'vitest';
import { usePortalContainer } from './portal-context';

expectTypeOf(usePortalContainer).returns.toEqualTypeOf<HTMLElement | null>();
