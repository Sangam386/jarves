const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'static/js/[name].[contenthash].js' : 'static/js/[name].js',
      chunkFilename: isProduction ? 'static/js/[name].[contenthash].chunk.js' : 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      clean: true,
      publicPath: '/',
    },
    
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'components': path.resolve(__dirname, 'src/components'),
        'utils': path.resolve(__dirname, 'src/utils'),
        'assets': path.resolve(__dirname, 'src/assets'),
      },
    },
    
    module: {
      rules: [
        // JavaScript and JSX
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions']
                  },
                  useBuiltIns: 'entry',
                  corejs: 3
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic'
                }]
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-transform-runtime'
              ]
            }
          }
        },
        
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: !isProduction,
              }
            }
          ]
        },
        
        // Images
        {
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8192, // 8kb
            },
          },
        },
        
        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        
        // Audio/Video
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
          type: 'asset/resource',
        },
      ],
    },
    
    plugins: [
      // HTML template
      new HtmlWebpackPlugin({
        template: 'public/index.html',
        filename: 'index.html',
        inject: true,
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
      
      // Extract CSS in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash].css',
          chunkFilename: 'static/css/[name].[contenthash].chunk.css',
        })
      ] : []),
    ],
    
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      runtimeChunk: {
        name: 'runtime',
      },
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      historyApiFallback: true,
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
          changeOrigin: true,
        },
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    performance: {
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
      hints: isProduction ? 'warning' : false,
    },
    
    stats: {
      errorDetails: true,
      children: false,
      modules: false,
      entrypoints: false,
    },
  };
};