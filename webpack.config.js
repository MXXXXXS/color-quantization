const process = require("process");
const path = require("path");
const { merge } = require("webpack-merge");
const { DefinePlugin } = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

//生产与开发环境区分
const NODE_ENV = process.env.NODE_ENV;
const isProduction = NODE_ENV === "production";
const mode = isProduction ? "production" : "development";

//常用路径定义
const public = path.resolve(__dirname, "public");
const dist = path.resolve(__dirname, "dist");

//入口定义
const entryIndex = path.resolve(__dirname, "src/app/index.tsx");

//引入的插件列表
//HTMLWebpackPlugin's options
const HTMLWebpackPlugin = require("html-webpack-plugin");
const indexTemplate = path.resolve(public, "index.html");
const favicon = path.resolve(public, "favicon.ico");

//clean-webpack-plugin
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

//基础配置
const base = {
  mode: mode,
  context: path.resolve(__dirname),
  devtool: isProduction ? undefined : "source-map",
  devServer: {
    open: true,
    compress: true,
    static: public,
    port: "auto",
    watchFiles: ["src/**/*"],
  },
  target: "web",
  module: {
    rules: [
      {
        test: /\.(tsx?|css)$/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: require("styled-jsx/webpack").loader,
            options: {
              type: (filename, options) => options.query.type || "scoped", // https://github.com/zeit/styled-jsx#styles-in-regular-css-files
            },
          },
        ],
      },
      {
        test: /\.html?$/,
        use: [
          {
            loader: "html-loader",
            options: { minimize: isProduction },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ["svg-inline-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs: false,
    },
  },
};

//前后端区分配置
const configs = [
  {
    entry: {
      index: entryIndex,
    },
    output: {
      filename: "[name].js",
      path: path.resolve(dist, "app"),
      publicPath: "/",
    },
    plugins: [
      // new CleanWebpackPlugin(),
      new HTMLWebpackPlugin({
        template: indexTemplate,
        favicon: favicon,
        filename: "index.html",
      }),
      new DefinePlugin({
        "process.browser": true,
      }),
      new NodePolyfillPlugin(),
    ],
  },
];

module.exports = configs.map((config) => merge(base, config));
