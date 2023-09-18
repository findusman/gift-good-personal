const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

module.exports = () => {
  let envVarsSettings = null;

  if (process.env.NODE_ENV === 'production') {
    envVarsSettings = new webpack.DefinePlugin({
      'process.env': {
        SHOPIFY_APP_NAME: JSON.stringify(process.env.SHOPIFY_APP_NAME),
        SHOPIFY_API_VERSION: JSON.stringify(process.env.SHOPIFY_API_VERSION),
        SHOPIFY_STOREFRONT_TOKEN: JSON.stringify(process.env.SHOPIFY_STOREFRONT_TOKEN),
        STRIPE_PUBLISHABLE_KEY: JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY),
        ONESCHEMA_CLIENT_ID: JSON.stringify(process.env.ONESCHEMA_CLIENT_ID),
        ONESCHEMA_JWT: JSON.stringify(process.env.ONESCHEMA_JWT),
        ONESCHEMA_TEMPLATE: JSON.stringify(process.env.ONESCHEMA_TEMPLATE),
        ONESCHEMA_TEMPLATE_UNIQUE_LINKS: JSON.stringify(process.env.ONESCHEMA_TEMPLATE_UNIQUE_LINKS),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    });
  } else {
    envVarsSettings = new Dotenv({
      path: path.resolve(__dirname, `../.env.development`),
    });
  }

  const config = {
    context: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    output: {
      path: path.resolve(__dirname, '../public/dist'),
      filename: '[name].js',
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            enforce: true,
            chunks: 'all',
          },
        },
      },
    },
    module: {
      rules: [
        {
          test: /\.?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|jp(e*)g|svg|gif)$/,
          use: ['file-loader'],
        },
      ],
    },
    resolve: {
      modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
    },
    plugins: [new ESLintPlugin(), envVarsSettings],
  };

  return config;
};
