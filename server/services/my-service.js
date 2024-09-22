'use strict'

const FormData = require('form-data')
const fs = require('fs').promises
const path = require('path')
const axios = require('axios')

module.exports = ({ strapi }) => ({
	async getImageDescription(imageUrl) {
		try {
			const apiKey = strapi.config.get(
				'plugin.auto-alt-caption-title-on-images-ai-enhanced.apiKey'
			)
			const apiUrl = 'https://api.forvoyez.com/describe'

			console.log('Processing image:', imageUrl)

			const { imageBuffer, filename } = await this.getImageBuffer(imageUrl)

			const formData = new FormData()
			formData.append('image', imageBuffer, { filename })
			formData.append('language', 'en')

			console.log('Sending request to ForVoyez API')
			const response = await axios.post(apiUrl, formData, {
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
			console.error('Error in getImageDescription:', error.message)
			if (error.response) {
				console.error('API response error:', error.response.data)
			}
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
		const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
		const imageBuffer = Buffer.from(response.data, 'binary')
		return { imageBuffer, filename: path.basename(new URL(imageUrl).pathname) }
	},
})
