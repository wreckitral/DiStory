const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { GenerateSW, InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
    mode: 'production',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        }),
        // Use InjectManifest for more control over your service worker
        new InjectManifest({
            swSrc: path.resolve(__dirname, 'src/scripts/sw.js'),
            swDest: 'sw.js',
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        }),

        // new GenerateSW({
        //   clientsClaim: true,
        //   skipWaiting: true,
        //   maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // }),
    ],
    optimization: {
        minimize: true,
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 512000, // 500KB
        maxEntrypointSize: 512000, // 500KB
    },
});
