/**
 * Icons are Phosphor (`@phosphor-icons/react`), re-exported unchanged so the
 * horizon-ui and x-core icon sets stay name-compatible. Use the `*Icon`
 * suffixed names (`CaretRightIcon`); the unsuffixed aliases are deprecated
 * upstream.
 *
 * Accessibility: Phosphor sets no `aria-*` attributes of its own. horizon-ui
 * therefore documents, and tests, that the consumer owns labelling: pass
 * `aria-hidden="true"` on decorative icons (or put the icon inside a labelled
 * control) and `aria-label`/`role="img"` on meaningful standalone icons.
 *
 * RTL: icons do not flip with `dir="rtl"` by themselves. Directional icons
 * (arrows, carets, chevrons and bend arrows that mean "back", "next" or
 * "forward": `ArrowLeftIcon`, `ArrowRightIcon`, `CaretLeftIcon`,
 * `CaretRightIcon`, `ArrowBendUpLeftIcon`, `ArrowUUpLeftIcon`, `SignInIcon`,
 * `SignOutIcon`) need Phosphor's `mirrored` prop under `dir="rtl"`, for
 * example `<CaretRightIcon mirrored={dir === 'rtl'} />`. Up/down arrows,
 * checks, plus/minus and symmetric glyphs must not be mirrored.
 *
 * @packageDocumentation
 */
export * from '@phosphor-icons/react';
export type { Icon, IconProps, IconWeight } from '@phosphor-icons/react';
