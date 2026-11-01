import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { buildStylesCss } from './scripts/build-styles';

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
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
            },
        },
    },
});
