const currentTask = process.env.npm_lifecycle_event; // either "dev" or "build"
const path = require('path'); // node way to generate absolute path
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fse = require('fs-extra');

const postCSSPlugins = [
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('postcss-hexrgba'),
    require('autoprefixer'),
];

class RunAfterCompile {
    apply(compiler) {
        compiler.hooks.done.tap('Copy images', function () {
            fse.copySync('./app/assets/images', './docs/assets/images');
        })
    }
}

let cssConfig = {
    test: /\.css$/i,
    use: ['css-loader?url=false', {loader: 'postcss-loader', options: {plugins: postCSSPlugins}}]
};

// Config same for both "dev" and "build"
let config = {
    entry: './app/assets/scripts/App.js',
    plugins: [new HtmlWebpackPlugin({filename: 'index.html', template: './app/index.html'})],
    //watch: true,
    module: {
        rules: [
            cssConfig
        ]
    },
};

// Config for only "dev" and "build"
if (currentTask == 'dev') {

    cssConfig.use.unshift('style-loader');

    config.output = {
        filename: 'bundled.js',
        // webpack requires an absolute path
        path: path.resolve(__dirname, 'app'),
    };

    config.devServer = {
        before: function(app, server) {
            server._watch('./app/**/*.html')
        },
        contentBase: path.join(__dirname, 'app'),
        hot: true,
        port: 3000,
        host: '0.0.0.0'
    };

    config.mode = 'development';

}

if (currentTask == 'build') {
    config.module.rules.push({
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env']
            }
        }
    });

    cssConfig.use.unshift(MiniCssExtractPlugin.loader);

    postCSSPlugins.push(require('cssnano'));

    config.output = {
        filename: '[name].[chunkhash].js',
        chunkFilename: '[name].[chunkhash].js',
        // webpack requires an absolute path
        path: path.resolve(__dirname, 'docs')
    };

    config.mode = 'production';

    config.optimization = {
        splitChunks: {chunks: "all"}
    };
    config.plugins.push(
        new CleanWebpackPlugin(), 
        new MiniCssExtractPlugin({filename: 'styles.[chunkhash].css'}),
        new RunAfterCompile(),
    );
}

module.exports = config;