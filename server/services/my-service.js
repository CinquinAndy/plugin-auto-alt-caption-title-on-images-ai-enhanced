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
			if (imageUrl.startsWith('/') || imageUrl.startsWith('http://localhost')) {
				// Get the upload provider configuration
				const uploadConfig = strapi.config.get('plugin.upload')
				console.log('Upload config:', uploadConfig)

				let filePath
				if (uploadConfig.provider === 'local') {
					// For local provider, construct the path
					console.log('Local provider detected')
					console.log('strapi.dirs:', strapi.dirs)
					filePath = path.join(strapi.dirs.static.public, imageUrl)
				} else {
					// For other providers, we might need to download the file
					// This is a placeholder and might need adjustment based on your setup
					filePath = path.join(
						strapi.dirs.tmp,
						'uploads',
						path.basename(imageUrl)
					)
					// You might need to implement file download logic here
				}

				console.log('Attempting to read file from:', filePath)

				try {
					imageBuffer = await fs.promises.readFile(filePath)
					console.log('Successfully read local file')
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
			}

			const formData = new FormData()
			// get the filename from the imageUrl (.png, .jpg, or .jpeg etc)

			formData.append('image', imageBuffer, { filename: filename })
			formData.append('language', 'en')

			console.log('Sending request to ForVoyez API')
			// const response = await strapi.httpClient.post(apiUrl, formData, {
			// 	headers: {
			// 		...formData.getHeaders(),
			// 		Authorization: `Bearer ${apiKey}`,
			// 	},
			// })

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
