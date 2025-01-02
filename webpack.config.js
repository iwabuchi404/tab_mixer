const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'popup.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
          },
        },
      },
      {
        test: /\.module\.css$/,  // .module.css ファイルのみを対象に
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]',
                exportLocalsConvention: 'camelCase',
              },
              modules: true,
              importLoaders: 1,
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,  // 通常の CSS ファイル用
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css'],
  },
  devtool: 'cheap-source-map',
};