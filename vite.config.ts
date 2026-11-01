import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
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
