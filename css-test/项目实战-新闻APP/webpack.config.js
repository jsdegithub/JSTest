const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
let htmlPlugins = ["index"].map((chunkName) => {
    return new HtmlWebpackPlugin({
        template: `./src/${chunkName}.html`,
        filename: `${chunkName}.html`,
        chunks: [chunkName],
    });
});
module.exports = {
    mode: "development",
    entry: {
        index: "./src/index.js",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "js/[name].[contentHash:8].js",
    },
    module: {
        rules: [
            //css 处理这一块
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 2,
                        },
                    },
                    "postcss-loader",
                ],
            },
            //less 处理这一块
            {
                test: /\.less$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader", "less-loader"],
            },
            {
                test: /\.html/,
                use: "html-withimg-loader",
            },

            {
                test: /\.(jpg|png|gif)$/,
                use: {
                    loader: "url-loader",
                    options: {
                        limit: 2,
                        outputPath: "img",
                    },
                },
            },
        ],
    },
    plugins: [
        ...htmlPlugins,
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
        }),
        new CleanWebpackPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
        contentBase: path.resolve(__dirname, "dist"),
        host: "127.0.0.1",
        compress: true,
        port: 8081,
        hot: true,
        hotOnly: true,
    },
};
