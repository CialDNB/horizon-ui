import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            include: ['src'],
            exclude: ['src/**/*.test.*', 'src/**/*.stories.*', 'src/__tests__'],
        }),
    ],
    build: {
        lib: { entry: 'src/index.ts', formats: ['es'] },
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
