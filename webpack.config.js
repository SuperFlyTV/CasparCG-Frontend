'use strict';

/*
    Webpack Configuration for React Server
    Compiles Typescript files to JS and hosts files on localhost:3000
*/

const path = require('path');
const HWP = require('html-webpack-plugin');
const webpack = require("webpack"); 

module.exports = {
    // React Entry Point
    entry: './src/client/index.tsx',
    mode: "production",
    devtool: "source-map",
    // Types of files to handle
    resolve: {
        extensions: [".ts", ".tsx", '.scss', '.js']
    },
    // Where the bundles are output
    output: {
        path: path.resolve(__dirname, './dist/client'),
        filename: '[name].js'
    },
    optimization: {
        minimize: false
    },
    // What to do with each file
    module: {
        rules: [
            // .ts and tsx. files are handled with ts-loader
            {
                test: /\.ts(x?)$/,
                include: [
                    path.resolve(__dirname, "src/client")
                ],
                exclude: /node_modules/,
                use: [{
                    loader: "ts-loader"
                }]
            }, 
            // js files passed through while adding a source map
            {
                enforce: "pre",
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, "src/client")
                ],
                loader: "source-map-loader"
            }, 
            // Sass files are converted to CSS
            {
                test: /\.scss$/,
                include: [
                    path.resolve(__dirname, "src/client")
                ],
                use: [
                  'style-loader',
                  'css-loader',
                  'sass-loader',
                ],
            }
        ]
    },
    // do not include the React Library, use a deciated script file or CDN
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
    // Handle HTL files
    plugins: [
        new HWP({
            template: 'src/client/index.html'
        }),
        // Allows the use of electron in React
        new webpack.ExternalsPlugin('commonjs', [
            'electron'
        ])
    ],
    // Webpack Dev Server settings
    devServer: {
        port: 3000,
        open: false
    }
}