import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import referenceUiTransform from './reference-ui-transform.js';

export default defineConfig({
  plugins: [referenceUiTransform(), react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // فصل المكتبات عن كود الموقع حتى المتصفح يخزنها ويصير الفتح أسرع
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          return 'vendor';
        },
      },
    },
  },
});
