'use strict'

module.exports = ({ strapi }) => ({
	async getImages(ctx) {
		try {
			// Retrieve all images from the database
			const images = await strapi.entityService.findMany(
				'plugin::upload.file',
				{
					filters: {
						mime: {
							startsWith: 'image/',
						},
					},
				}
			)

			// filter on type of image, get only images with type of image/png, image/jpeg, image/jpg, image/webp
			let imagesFiltered = images.filter(
				image =>
					image.mime === 'image/png' ||
					image.mime === 'image/jpeg' ||
					image.mime === 'image/jpg' ||
					image.mime === 'image/webp'
			)

			// Filter images that don't have alternativeText and caption
			imagesFiltered = imagesFiltered
				.map(image => {
					if (image.alternativeText === null && image.caption === null) {
						return {
							id: image.id,
							name: image.name,
							alternativeText: image.alternativeText,
							caption: image.caption,
							url: image.url,
						}
					}
				})
				.filter(Boolean) // Remove undefined values from the array

			// Return the filtered images in the response body
			ctx.body = {
				data: imagesFiltered,
				apiKeyIsSet: process.env.FORVOYEZ_API_KEY !== '' ? true : false,
			}
		} catch (error) {
			// Throw an error if there's an issue retrieving images
			ctx.throw(500, 'Error retrieving images')
		}
	},

	async process(ctx) {
		try {
			// Extract imageUrl and imageId from the request body
			const { imageUrl, imageId } = ctx.request.body

			// Send the image URL to the forvoyez API for analysis
			const imageDescription = await strapi
				.service(
					'plugin::auto-alt-caption-title-on-images-ai-enhanced.my-service'
				)
				.getImageDescription(imageUrl)

			// Update the image fields with the analysis results
			await strapi.entityService.update('plugin::upload.file', imageId, {
				data: {
					name: imageDescription.name,
					alternativeText: imageDescription.alternativeText,
					caption: imageDescription.caption,
				},
			})

			// Return a success message and the image description in the response body
			ctx.body = {
				message: 'Image processed successfully',
				data: imageDescription,
			}
		} catch (error) {
			// Log the error and throw an error if there's an issue processing the image
			console.error('Error processing image:', error)
			ctx.throw(500, 'Error processing image')
		}
	},
})
