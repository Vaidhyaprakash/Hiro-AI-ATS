import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
    }),
  ],
  source: {
    entry: {
      index: './src/index.jsx',
    },
  },
  output: {
    distPath: {
      root: 'dist',
      js: 'assets/js',
      css: 'assets/css',
      font: 'assets/fonts',
      image: 'assets/images',
      media: 'assets/media',
    },
    filenameHash: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  dev: {
    historyApiFallback: true,
    assetPrefix: '/',
    progressBar: true,
  },
  html: {
    template: './src/index.html',
  },
  tools: {
    postcss: (config) => {
      // Add any PostCSS plugins if needed
      return config;
    },
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        shared: {
          test: /[\\/]shared[\\/]/,
          name: 'shared',
          chunks: 'all',
        },
        admin: {
          test: /[\\/]bundles[\\/]admin[\\/]/,
          name: 'admin',
          chunks: 'all',
        },
        organization: {
          test: /[\\/]bundles[\\/]organization[\\/]/,
          name: 'organization',
          chunks: 'all',
        },
        exam: {
          test: /[\\/]bundles[\\/]exam[\\/]/,
          name: 'exam',
          chunks: 'all',
        },
      },
    },
  },
});
