import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'library') {
    // Library build configuration
    return {
      plugins: [
        react(),
        dts({
          include: ['src'],
          exclude: ['src/main.tsx', 'test/**/*'],
        }),
      ],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'PatchAndResolve',
          formats: ['es', 'umd'],
          fileName: (format) => `patchAndResolve.${format}.js`,
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
      },
    };
  }

  // Development/demo build configuration
  return {
    plugins: [react()],
  };
});
