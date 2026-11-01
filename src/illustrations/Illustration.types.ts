import type { SVGProps } from 'react';
import type { DnbBase } from '../types/DnbBase';

/** Props shared by every illustration component. */
export type IllustrationProps = SVGProps<SVGSVGElement> &
    DnbBase & {
        /**
         * Sets width and height together (number = px, string = any CSS length).
         * Illustrations keep their viewBox, so a non-square artwork scales to fit
         * inside the box. Omit to use the artwork's intrinsic size.
         */
        size?: number | string;
        /**
         * Accessible name rendered as an SVG `<title>`. Makes the illustration
         * `role="img"`; without a title or `aria-label` it is `aria-hidden`.
         */
        title?: string;
    };
