import '../src/styles.css';
import { createElement } from 'react';
import type { Preview } from '@storybook/react-vite';
const preview: Preview = {
  decorators: [
    (Story) =>
      createElement(
        'main',
        null,
        createElement(
          'h1',
          { style: { fontSize: '20px' } },
          'Component reference',
        ),
        createElement(Story),
      ),
  ],
};
export default preview;
