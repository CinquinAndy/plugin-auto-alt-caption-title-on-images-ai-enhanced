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
				// Construct the correct path for local files
				const uploadConfig = strapi.config.get('plugin.upload')
				const publicPath = uploadConfig.providerOptions?.sizeLimit
					? uploadConfig.providerOptions.sizeLimit
					: strapi.dirs.public

				const localPath = path.join(
					publicPath,
					imageUrl.replace('/uploads/', '')
				)
				console.log('Attempting to read file from:', localPath)

				try {
					imageBuffer = await fs.promises.readFile(localPath)
				} catch (readError) {
					console.error('Error reading local file:', readError)
					throw new Error(`Unable to read local file: ${localPath}`)
				}
			} else {
				const imageResponse = await strapi.axios.get(imageUrl, {
					responseType: 'arraybuffer',
				})
				imageBuffer = Buffer.from(imageResponse.data, 'binary')
			}

			const formData = new FormData()
			formData.append('image', imageBuffer, { filename: 'image.jpg' })
			formData.append('language', 'en')

			const response = await strapi.axios.post(apiUrl, formData, {
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${apiKey}`,
				},
			})

			const data = response.data

			return {
				name: data.title || '',
				alternativeText: data.alt || '',
				caption: data.caption || '',
			}
		} catch (error) {
			console.error('Error in getImageDescription:', error)
			throw new Error('Failed to process image: ' + error.message)
		}
	},
})
