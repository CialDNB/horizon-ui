import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { buildStylesCss } from './scripts/build-styles';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
};
// Runtime and peer dependencies stay bare imports so consumers dedupe them
// (and share React/Radix context); never vendor them into dist.
const deps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
];
const isExternal = (id: string) =>
    deps.some((dep) => id === dep || id.startsWith(`${dep}/`));

/** Emits the precompiled, scoped stylesheet as `dist/styles.css`. */
const horizonStyles = (): Plugin => ({
    name: 'horizon-styles',
    async generateBundle() {
        this.emitFile({
            type: 'asset',
            fileName: 'styles.css',
            source: await buildStylesCss(),
        });
    },
});

export default defineConfig({
    plugins: [
        horizonStyles(),
        dts({
            include: ['src'],
            exclude: [
                'src/**/*.test.*',
                'src/**/*.test-d.ts',
                'src/**/*.stories.*',
                'src/stories',
                'src/vite-env-virtual.d.ts',
                'src/__tests__',
            ],
        }),
    ],
    build: {
        lib: {
            entry: {
                index: 'src/index.ts',
                'tokens/index': 'src/tokens/index.ts',
            },
            formats: ['es'],
        },
        sourcemap: true,
        rollupOptions: {
            external: isExternal,
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
            },
        },
    },
});
