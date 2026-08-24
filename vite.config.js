import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import referenceUiTransform from './reference-ui-transform.js';

export default defineConfig({
  plugins: [referenceUiTransform(), react()],
});
