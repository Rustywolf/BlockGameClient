var path = require('path');
var webpack = require('webpack');

module.exports = {
   entry: './src/app.js',
   resolve: {
     modules: [
       path.resolve(__dirname, 'src'),
       "node_modules"
     ]
   },
   output: {
       path: path.resolve(__dirname, 'build'),
       filename: 'app.js'
   },
   module: {
       loaders: [
           {
               test: /\.js$/,
               loader: 'babel-loader',
               query: {
                   presets: ['env'],
                   plugins: ["transform-object-rest-spread"]
               }
           }
       ]
   },
   plugins: [
     new webpack.optimize.UglifyJsPlugin(),
     new webpack.DefinePlugin({
       'process.env': {
         'NODE_ENV': JSON.stringify('production')
       }
     })
   ],
   stats: {
       colors: true
   },
   devtool: 'source-map'
};
