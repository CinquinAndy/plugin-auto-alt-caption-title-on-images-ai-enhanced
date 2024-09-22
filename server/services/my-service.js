'use strict'

const FormData = require('form-data')
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args))

module.exports = ({ strapi }) => ({
	async getImageDescription(imageUrl) {
		try {
			const apiKey = process.env.FORVOYEZ_API_KEY
			const apiUrl = 'https://api.forvoyez.com/describe'

			console.log('imageUrl:', imageUrl)
			console.log('apiKey:', apiKey)
			console.log('apiUrl:', apiUrl)

			let imageResponse
			if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('/')) {
				const fullImageUrl = imageUrl.startsWith('/')
					? `http://localhost:1337${imageUrl}`
					: imageUrl
				imageResponse = await fetch(fullImageUrl)
				if (!imageResponse.ok) {
					throw new Error(`HTTP error! status: ${imageResponse.status}`)
				}
			} else {
				imageResponse = await fetch(imageUrl)
				if (!imageResponse.ok) {
					throw new Error(`HTTP error! status: ${imageResponse.status}`)
				}
			}

			const imageBlob = await imageResponse.blob()

			const formData = new FormData()
			formData.append('image', imageBlob, 'image.jpg')
			formData.append('language', 'en') // You can change this to the desired language

			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				body: formData,
			})

			if (!response.ok) {
				throw new Error(`ForVoyez API error! status: ${response.status}`)
			}

			const data = await response.json()

			return {
				name: data.title || '',
				alternativeText: data.alt || '',
				caption: data.caption || '',
			}
		} catch (error) {
			console.error('Error in getImageDescription:', error)
			throw new Error('Failed to process image')
		}
	},
})
