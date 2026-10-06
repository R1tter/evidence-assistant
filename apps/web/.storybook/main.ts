import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  staticDirs: ['../public'],
  viteFinal: (config) => ({ ...config, publicDir: false }),
  framework: '@storybook/react-vite',
};
export default config;
