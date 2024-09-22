'use strict'

const FormData = require('form-data')
const fs = require('fs').promises
const path = require('path')

module.exports = ({ strapi }) => ({
	async getImageDescription(imageUrl) {
		try {
			const apiKey = process.env.FORVOYEZ_API_KEY
			const apiUrl = 'https://api.forvoyez.com/describe'

			console.log('Processing image:', imageUrl)

			const { imageBuffer, filename } = await this.getImageBuffer(imageUrl)

			const formData = new FormData()
			formData.append('image', imageBuffer, { filename })
			formData.append('language', 'en')

			// Optional: Add context or schema if needed
			// formData.append('data', JSON.stringify({ context: 'Additional context', schema: {...} }));

			console.log('Sending request to ForVoyez API')
			const response = await strapi.httpClient.post(apiUrl, formData, {
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
			console.error('Error in getImageDescription:', error)
			throw new Error('Failed to process image: ' + error.message)
		}
	},

	async getImageBuffer(imageUrl) {
		if (imageUrl.startsWith('/') || imageUrl.startsWith('http://localhost')) {
			return this.getLocalImageBuffer(imageUrl)
		} else {
			return this.getRemoteImageBuffer(imageUrl)
		}
	},

	async getLocalImageBuffer(imageUrl) {
		const uploadConfig = strapi.config.get('plugin.upload')
		const filePath =
			uploadConfig.provider === 'local'
				? path.join(strapi.dirs.static.public, imageUrl)
				: path.join(strapi.dirs.tmp, 'uploads', path.basename(imageUrl))

		console.log('Reading local file:', filePath)
		const imageBuffer = await fs.readFile(filePath)
		return { imageBuffer, filename: path.basename(filePath) }
	},

	async getRemoteImageBuffer(imageUrl) {
		console.log('Fetching remote image:', imageUrl)
		const response = await strapi.httpClient.get(imageUrl, {
			responseType: 'arraybuffer',
		})
		const imageBuffer = Buffer.from(response.data, 'binary')
		return { imageBuffer, filename: path.basename(new URL(imageUrl).pathname) }
	},
})
