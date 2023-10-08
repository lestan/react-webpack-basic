/**
 * Webpack configuration to build from src into dist
 * Borrowed heavily from: https://www.toptal.com/react/webpack-react-tutorial-pt-1 and related https://github.com/mpontus/webpack-react
 */
const path = require('path');
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require("terser-webpack-plugin");
const CssMinimizerWebpackPlugin = require("css-minimizer-webpack-plugin");

// assume the project directory is the directory the build was initiated from
const appDir = process.cwd();

module.exports = function (_env, argv) {

  // figure out which environment we're running in
  // argv contains any parameters passed to the webpack cli
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    devtool: isDevelopment && "cheap-module-source-map",
    // the file that we want to parse as the root of the react application
    entry: './src/index.js',
    // where we want the build output to go to
    output: {
      path: path.resolve(appDir, 'dist'),
      // how to label the generated files
      filename: 'assets/js/[name].[contenthash:8].bundle.js',
      publicPath: '/'
    },
    module: {
      rules: [
        // process javascript and react files
        {
          // only match any files ending in these extensions
          test: /\.(js|jsx)$/,
          // don't process anything within the node_modules directory
          exclude: /(node_modules)/,
          use: {
            // babel configuration is in babel.config.js in the root of the project
            // and is picked up automatically by the babel loader
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              envName: isProduction ? "production" : "development"
            }
          },
        },
        // process css stylesheets
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin : 'style-loader',
            'css-loader'
          ],
        },
        // process images
        {
          test: /\.(png|jpg|gif)$/i,
          use: {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: "static/media/img/[name].[hash:8].[ext]"
            }
          }
        },
        // process svg
        {
          test: /\.svg$/,
          use: ["@svgr/webpack"]
        },
        // process font files
        {
          test: /\.(eot|otf|ttf|woff|woff2)$/,
          loader: require.resolve("file-loader"),
          options: {
            name: "static/media/fonts/[name].[hash:8].[ext]"
          }
        }
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"]
    },
    plugins: [
      isProduction &&
      new MiniCssExtractPlugin({
        filename: "assets/css/[name].[contenthash:8].css",
        chunkFilename: "assets/css/[name].[contenthash:8].chunk.css",
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(appDir, "public/index.html"),
        inject: true
      }),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          isProduction ? "production" : "development"
        )
      })
      //new CopyPlugin({ patterns: [{ 'from': 'src/img', 'to': 'assets/img' }] })
    ].filter(Boolean),
    // apply optimizations for production
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserWebpackPlugin({
          terserOptions: {
            compress: {
              comparisons: false
            },
            mangle: {
              safari10: true
            },
            output: {
              comments: false,
              ascii_only: true
            },
            warnings: false
          }
        }),
        new CssMinimizerWebpackPlugin()
      ],
      // split files into chunks for performance
      splitChunks: {
        chunks: "all",
        minSize: 0,
        maxInitialRequests: 10,
        maxAsyncRequests: 10,
        cacheGroups: {
          vendors: {
            test: /[\\/node_modules[\\/]]/,
            name(module, chunks, cacheGroupKey) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[i];
              return `${cacheGroupKey}.${packageName.replace("@", "")}`;
            }
          },
          common: {
            minChunks: 2,
            priority: -10
          }
        },
      },
      runtimeChunk: "single",
    },
    devServer: {
      compress: true,
      historyApiFallback: true,
      open: true,
      //overlay: true,
      //contentBase: path.join(__dirname, 'public'),
      port: 3000,
    },
  }
};
