'use strict'

const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

module.exports = ({ strapi }) => ({
	async getImageDescription(imageUrl) {
		try {
			const apiKey = process.env.FORVOYEZ_API_KEY
			const apiUrl = 'https://api.forvoyez.com/describe'

			console.log('imageUrl:', imageUrl)
			console.log('apiKey:', apiKey)
			console.log('apiUrl:', apiUrl)

			let imageBuffer
			if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('/')) {
				// Log Strapi configuration
				console.log('Strapi config:', strapi.config)
				console.log('Strapi dirs:', strapi.dirs)

				// Try multiple methods to get the correct path
				let publicPath
				if (strapi.dirs && strapi.dirs.public) {
					publicPath = strapi.dirs.public
				} else if (strapi.config && strapi.config.get) {
					const uploadConfig = strapi.config.get('plugin.upload')
					publicPath =
						uploadConfig &&
						uploadConfig.providerOptions &&
						uploadConfig.providerOptions.sizeLimit
							? uploadConfig.providerOptions.sizeLimit
							: process.cwd()
				} else {
					publicPath = process.cwd()
				}

				console.log('Determined public path:', publicPath)

				const localPath = path.join(
					publicPath,
					'uploads',
					imageUrl.split('/uploads/')[1]
				)
				console.log('Attempting to read file from:', localPath)

				try {
					imageBuffer = await fs.promises.readFile(localPath)
					console.log('Successfully read local file')
				} catch (readError) {
					console.error('Error reading local file:', readError)
					throw new Error(`Unable to read local file: ${localPath}`)
				}
			} else {
				console.log('Fetching remote image')
				const imageResponse = await strapi.axios.get(imageUrl, {
					responseType: 'arraybuffer',
				})
				imageBuffer = Buffer.from(imageResponse.data, 'binary')
				console.log('Successfully fetched remote image')
			}

			const formData = new FormData()
			formData.append('image', imageBuffer, { filename: 'image.jpg' })
			formData.append('language', 'en')

			console.log('Sending request to ForVoyez API')
			const response = await strapi.axios.post(apiUrl, formData, {
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${apiKey}`,
				},
			})

			console.log('Received response from ForVoyez API')
			const data = response.data

			return {
				name: data.title || '',
				alternativeText: data.alt || '',
				caption: data.caption || '',
			}
		} catch (error) {
			console.error('Detailed error in getImageDescription:', error)
			throw new Error('Failed to process image: ' + error.message)
		}
	},
})
