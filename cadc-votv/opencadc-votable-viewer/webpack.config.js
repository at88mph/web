var webpack = require("webpack");

module.exports = {
  entry: __dirname + "/index.js",
  devtool: "source-map",
  output: {
    path: __dirname + "/dist",
    filename: "opencadc-votable-viewer.min.js"
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ]
};
