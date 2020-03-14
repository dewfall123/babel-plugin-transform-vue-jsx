module.exports = {
  mode: 'development',
  entry: './example.js',
  output: {
    path: __dirname,
    filename: 'example.build.js',
  },
  devServer: {
    port: '8080',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
}
