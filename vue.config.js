const
	webpack = require('webpack'),
	fs = require('fs'),
	packageJson = fs.readFileSync('./package.json'),
	version = JSON.parse(packageJson).version || 'Unknown';

module.exports = {
	publicPath: '',
	assetsDir: 'live-atlas',

	pluginOptions: {
        svgSprite: {
            loaderOptions: {
                extract: true,
                spriteFilename: 'live-atlas/img/icons.[hash:8].svg'
            },
        }
    },

	configureWebpack: {
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    PACKAGE_VERSION: '"' + version + '"'
                }
            })
        ]
    },

	chainWebpack: config => {
		config.plugin('html')
			.tap(args => {
				args[0].minify = false
				return args
			})
		config.module
			.rule('svg-sprite')
			.use('svgo-loader')
			.loader('svgo-loader')
	}
}
