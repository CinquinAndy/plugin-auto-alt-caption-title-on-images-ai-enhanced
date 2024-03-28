module.exports = [
	{
		method: 'GET',
		path: '/images',
		handler: 'myController.getImages',
		config: {
			policies: [],
			auth: false,
		},
	},
	{
		method: 'POST',
		path: '/process',
		handler: 'myController.process',
		config: {
			policies: [],
			auth: false,
		},
	},
]
