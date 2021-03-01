const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
    CleanWebpackPlugin
} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    entry: './index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            // For pure CSS - /\.css$/i,
            // For Sass/SCSS - /\.((c|sa|sc)ss)$/i,
            // For Less - /\.((c|le)ss)$/i,   
            // .css .scss .sass .less
            test: /\.((c|sa|sc)ss)$/i,
            use: [
                MiniCssExtractPlugin.loader,
                // "style-loader",
                {
                    loader: "css-loader",
                    options: {
                        // modules: true,
                        importLoaders: 2
                    },
                },
                {
                    loader: "postcss-loader",
                },
                // Can be `less-loader`
                "sass-loader"
            ],
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html",
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "index.css"
        })
    ],
};