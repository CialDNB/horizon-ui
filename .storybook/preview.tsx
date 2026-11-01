import type { Decorator, Preview } from '@storybook/react-vite';
import 'virtual:horizon-styles.css';
import { HorizonProvider } from '../src/provider';
import type { Brand } from '../src/tokens';

const withHorizon: Decorator = (Story, context) => {
    const brand = context.globals['brand'] as Brand;
    const direction = context.globals['direction'] === 'rtl' ? 'rtl' : 'ltr';
    return (
        <HorizonProvider
            brand={brand}
            dir={direction}
            style={{
                background: 'var(--background)',
                minBlockSize: '100vh',
                padding: 16,
            }}
        >
            <Story />
        </HorizonProvider>
    );
};

const preview: Preview = {
    tags: ['autodocs'],
    decorators: [withHorizon],
    initialGlobals: { brand: 'cial', direction: 'ltr' },
    globalTypes: {
        brand: {
            description: 'Horizon brand',
            toolbar: {
                title: 'Brand',
                icon: 'paintbrush',
                dynamicTitle: true,
                items: [
                    { value: 'cial', title: 'CIAL' },
                    { value: 'dnb', title: 'D&B' },
                    { value: 'il', title: 'IL' },
                ],
            },
        },
        direction: {
            description: 'Text direction',
            toolbar: {
                title: 'Direction',
                icon: 'transfer',
                dynamicTitle: true,
                items: [
                    { value: 'ltr', title: 'LTR' },
                    { value: 'rtl', title: 'RTL' },
                ],
            },
        },
    },
    parameters: {
        layout: 'fullscreen',
        a11y: { test: 'error' },
        viewport: {
            options: {
                mobile: {
                    name: 'Mobile',
                    styles: { width: '375px', height: '812px' },
                },
                tablet: {
                    name: 'Tablet',
                    styles: { width: '768px', height: '1024px' },
                },
                laptop: {
                    name: 'Laptop',
                    styles: { width: '1280px', height: '800px' },
                },
                desktop: {
                    name: 'Desktop',
                    styles: { width: '1920px', height: '1080px' },
                },
            },
        },
    },
};

export default preview;
