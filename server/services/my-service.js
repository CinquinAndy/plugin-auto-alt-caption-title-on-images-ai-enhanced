// server/services/my-service.js
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
			if (!apiKey) {
				throw new Error('FORVOYEZ_API_KEY is not set')
			}

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
				timeout: 30000, // 30 secondes timeout
			}

			const response = await axios.post(apiUrl, formData, axiosConfig)
			const data = response.data

			// Nettoyer et tronquer les données
			return {
				name: this.cleanAndTruncateText(data.title || '', 250),
				alternativeText: this.cleanAndTruncateText(data.alt_text || '', 250),
				caption: this.cleanAndTruncateText(data.caption || '', 250),
			}
		} catch (error) {
			console.error('Error in getImageDescription:', error)
			if (error.response) {
				console.error('API response error:', error.response.data)
			}
			throw new Error(`Failed to process image: ${error.message}`)
		}
	},

	cleanAndTruncateText(text, maxLength) {
		// Nettoyer le texte des caractères spéciaux et le tronquer
		return text
			.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Supprimer les caractères de contrôle
			.trim()
			.substring(0, maxLength)
	},

	async getImageBuffer(imageUrl) {
		try {
			if (imageUrl.startsWith('/') || imageUrl.startsWith('http://localhost')) {
				return this.getLocalImageBuffer(imageUrl)
			}
			return this.getRemoteImageBuffer(imageUrl)
		} catch (error) {
			console.error('Error getting image buffer:', error)
			throw new Error(`Failed to get image buffer: ${error.message}`)
		}
	},

	async getLocalImageBuffer(imageUrl) {
		try {
			const uploadConfig = strapi.config.get('plugin.upload')
			let filePath

			if (uploadConfig.provider === 'local') {
				// Gestion des chemins locaux
				const publicPath = strapi.dirs.static.public
				const urlPath = decodeURIComponent(imageUrl).replace(/^\//, '')
				filePath = path.join(publicPath, urlPath)
			} else {
				// Gestion des autres providers
				filePath = path.join(
					strapi.dirs.tmp,
					'uploads',
					path.basename(imageUrl)
				)
			}

			const imageBuffer = await fs.readFile(filePath)
			return {
				imageBuffer,
				filename: path.basename(filePath),
			}
		} catch (error) {
			console.error('Error reading local image:', error)
			throw new Error(`Failed to read local image: ${error.message}`)
		}
	},

	async getRemoteImageBuffer(imageUrl) {
		try {
			const response = await axios.get(imageUrl, {
				responseType: 'arraybuffer',
				httpsAgent: new https.Agent({
					rejectUnauthorized: strapi.config.get('environment') === 'production',
				}),
				timeout: 10000, // 10 secondes timeout pour les images distantes
			})

			const imageBuffer = Buffer.from(response.data, 'binary')
			return {
				imageBuffer,
				filename: path.basename(new URL(imageUrl).pathname),
			}
		} catch (error) {
			console.error('Error fetching remote image:', error)
			throw new Error(`Failed to fetch remote image: ${error.message}`)
		}
	},
})
