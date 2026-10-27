import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // GitHub project pages live under the repository name; local development stays at /.
  base: command === 'build' ? '/Portfolio-Website/' : '/',
}));
