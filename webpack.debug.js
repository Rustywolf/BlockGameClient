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
   stats: {
       colors: true
   },
   devtool: 'source-map'
};
