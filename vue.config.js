module.exports = {
	publicPath: '',

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
