module.exports = {
	publicPath: '',

	chainWebpack: config => {
		config.module
			.rule('svg-sprite')
			.use('svgo-loader')
			.loader('svgo-loader')
	}
}
