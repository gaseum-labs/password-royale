import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
	plugins: [
		react(),
		babel({
			presets: [reactCompilerPreset()],
		}),
		vanillaExtractPlugin(),
	],
	build: {
		outDir: 'dist/public',
	},
	publicDir: 'src/public',
	server: {
		allowedHosts: ['passwordroyale.gaseumlabs.net'],
	},
});
