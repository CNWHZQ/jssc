// webpack.config.js
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    mode:"development",//production|development
    entry: './src/jssc.ts',
    output: {
        filename: './jssc.js',
        // export to AMD, CommonJS, or window
        libraryTarget: 'umd',
        // the name exported to window
        library: 'JSSC'
    },

    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader"
        }]
    },
    resolve: {
        extensions: [
            '.ts'
        ]
    },
    plugins: [
        new UglifyJSPlugin({
            sourceMap: true
        })
    ]
};