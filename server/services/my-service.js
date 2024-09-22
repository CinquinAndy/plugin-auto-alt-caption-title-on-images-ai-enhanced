'use strict'

const FormData = require('form-data')
const fs = require('fs').promises
const path = require('path')
const axios = require('axios')
const https = require('https')

module.exports = ({ strapi }) => ({
	async getImageDescription(imageUrl) {
		try {
			const apiKey = process.env.FORVOYEZ_API_KEY
			const apiUrl = 'https://forvoyez.com/api/describe'
			const isProduction = strapi.config.get('environment') === 'production'

			const { imageBuffer, filename } = await this.getImageBuffer(imageUrl)

			const formData = new FormData()
			formData.append('image', imageBuffer, { filename })
			formData.append('language', 'en')

			const axiosConfig = {
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${apiKey}`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: isProduction,
				}),
			}

			const response = await axios.post(apiUrl, formData, axiosConfig)

			const data = response.data

			return {
				name: data.title || '',
				alternativeText: data.alt_text || '',
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

		const imageBuffer = await fs.readFile(filePath)
		return { imageBuffer, filename: path.basename(filePath) }
	},

	async getRemoteImageBuffer(imageUrl) {
		const response = await axios.get(imageUrl, {
			responseType: 'arraybuffer',
			httpsAgent: new https.Agent({
				rejectUnauthorized: strapi.config.get('environment') === 'production',
			}),
		})
		const imageBuffer = Buffer.from(response.data, 'binary')
		return { imageBuffer, filename: path.basename(new URL(imageUrl).pathname) }
	},
})
