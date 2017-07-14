// var webpack = require("webpack");

module.exports = {
  entry: __dirname + "/index.js",
  devtool: "source-map",
  output: {
    path: __dirname + "/dist",
    filename: "opencadc-votable-viewer.js"
  },
  // plugins: [
  //   new webpack.optimize.UglifyJsPlugin({minimize: true})
  // ],
  externals: {
    // require("jquery") is external and available
    //  on the global var jQuery
    "jquery": "jQuery"
  }
};
