const prod = require('./webpack.prod.js')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  ...prod,
  plugins: [
    ...prod.plugins,
    new BundleAnalyzerPlugin()
  ],
}
