import HtmlWebpackPlugin from 'html-webpack-plugin'
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  context: __dirname,
  entry: './story-app',
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
  },
  devServer: {
    port: 3000,
  },
  module: {
    rules: [
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
        },
      },
      {
        test: /\.(ttf|eot|woff2?)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
}
