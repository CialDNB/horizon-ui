import { forwardRef } from 'react';
import type { IllustrationProps } from './Illustration.types';

type IllustrationFrameProps = IllustrationProps & {
    /** The artwork's own `viewBox`, `width` and `height`, copied verbatim from the source SVG. */
    intrinsic: { viewBox: string; width: number; height: number };
};

/**
 * Internal `<svg>` wrapper used by the generated illustration components. It
 * only adds what a component wrapper needs (sizing, accessibility, ref, prop
 * spread); the artwork inside `children` is never altered.
 */
export const IllustrationFrame = forwardRef<
    SVGSVGElement,
    IllustrationFrameProps
>(function IllustrationFrame(
    { intrinsic, size, title, children, width, height, ...rest },
    ref
) {
    const labelled =
        title !== undefined ||
        rest['aria-label'] !== undefined ||
        rest['aria-labelledby'] !== undefined;
    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox={intrinsic.viewBox}
            width={size ?? width ?? intrinsic.width}
            height={size ?? height ?? intrinsic.height}
            focusable="false"
            role={labelled ? 'img' : undefined}
            aria-hidden={labelled ? undefined : true}
            {...rest}
        >
            {title === undefined ? null : <title>{title}</title>}
            {children}
        </svg>
    );
});
