

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');


module.exports = {
  entry: {
    index: './public/js/index.js',
    deploy: './public/js/deploy.js',
    upcomingmint: './public/js/upcomingmint.js',
    ongoingmint: './public/js/ongoingmint.js',
    passedmint: './public/js/passedmint.js',
    mydeploy: './public/js/mydeploy.js',
    token: './public/js/token.js',
    mybalance: './public/js/mybalance.js',
    mymints: './public/js/mymints.js',
    mytransfer: './public/js/mytransfer.js',
    myburn: './public/js/myburn.js',
    rune: './public/js/rune.js', 
    explorer: './public/js/explorer.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      zlib: require.resolve("browserify-zlib"),
      url: require.resolve("url/"),
      buffer: require.resolve('buffer/'),
      vm: require.resolve("vm-browserify"),
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser")
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: './public/rune.html',
      filename: 'rune.html',
      chunks: ['rune'],
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      template: './public/deploy.html',
      filename: 'deploy.html',
      chunks: ['deploy'],
    }),
    new HtmlWebpackPlugin({
      template: './public/upcomingmint.html',
      filename: 'upcomingmint.html',
      chunks: ['upcomingmint'],
    }),
    new HtmlWebpackPlugin({
      template: './public/ongoingmint.html',
      filename: 'ongoingmint.html',
      chunks: ['ongoingmint'],
    }),
    new HtmlWebpackPlugin({
      template: './public/passedmint.html',
      filename: 'passedmint.html',
      chunks: ['passedmint'],
    }),
    new HtmlWebpackPlugin({
      template: './public/mydeploy.html',
      filename: 'mydeploy.html',
      chunks: ['mydeploy'],
    }),
    new HtmlWebpackPlugin({
      template: './public/token.html',
      filename: 'token.html',
      chunks: ['token'],
    }),
    new HtmlWebpackPlugin({
      template: './public/mybalance.html',
      filename: 'mybalance.html',
      chunks: ['mybalance'],
    }),
    new HtmlWebpackPlugin({
      template: './public/mymints.html',
      filename: 'mymints.html',
      chunks: ['mymints'],
    }), 
    new HtmlWebpackPlugin({
      template: './public/mytransfer.html',
      filename: 'mytransfer.html',
      chunks: ['mytransfer'],
    }),
    new HtmlWebpackPlugin({
      template: './public/myburn.html',
      filename: 'myburn.html',
      chunks: ['myburn'], 
    }),
    new HtmlWebpackPlugin({
      template: './public/explorer.html',
      filename: 'explorer.html',
      chunks: ['explorer'], 
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 3000,
  },
};

