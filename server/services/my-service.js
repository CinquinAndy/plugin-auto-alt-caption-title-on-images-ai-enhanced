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
			let filename

			if (imageUrl.startsWith('/') || imageUrl.startsWith('http://localhost')) {
				const uploadConfig = strapi.config.get('plugin.upload')
				console.log('Upload config:', uploadConfig)

				let filePath
				if (uploadConfig.provider === 'local') {
					console.log('Local provider detected')
					console.log('strapi.dirs:', strapi.dirs)
					filePath = path.join(strapi.dirs.static.public, imageUrl)
				} else {
					filePath = path.join(
						strapi.dirs.tmp,
						'uploads',
						path.basename(imageUrl)
					)
				}

				console.log('Attempting to read file from:', filePath)

				try {
					imageBuffer = await fs.promises.readFile(filePath)
					console.log('Successfully read local file')
					filename = path.basename(filePath)
					console.log('Extracted filename:', filename)
				} catch (readError) {
					console.error('Error reading local file:', readError)
					throw new Error(`Unable to read local file: ${filePath}`)
				}
			} else {
				console.log('Fetching remote image')
				const imageResponse = await strapi.httpClient.get(imageUrl, {
					responseType: 'arraybuffer',
				})
				imageBuffer = Buffer.from(imageResponse.data, 'binary')
				console.log('Successfully fetched remote image')
				filename = path.basename(new URL(imageUrl).pathname)
				console.log('Extracted filename from URL:', filename)
			}

			const formData = new FormData()
			console.log('Appending image to FormData with filename:', filename)
			formData.append('image', imageBuffer, { filename: filename })
			formData.append('language', 'en')

			console.log('Sending request to ForVoyez API')
			const response = await strapi.httpClient.post(apiUrl, formData, {
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${apiKey}`,
				},
			})

			console.log('Received response from ForVoyez API')
			console.log('Response status:', response.status)
			console.log('Response data:', JSON.stringify(response.data, null, 2))

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
