// server/controllers/my-controller.js
'use strict'

module.exports = ({ strapi }) => ({
	async getImages(ctx) {
		try {
			// Récupérer toutes les images avec une requête plus complète
			const images = await strapi.entityService.findMany(
				'plugin::upload.file',
				{
					filters: {
						mime: {
							$startsWith: 'image/',
						},
					},
					populate: '*', // Pour récupérer toutes les relations
					sort: { createdAt: 'desc' },
					limit: -1, // Pour récupérer toutes les images sans limite
				}
			)

			// Filtrer pour les types d'images supportés
			const supportedMimeTypes = [
				'image/png',
				'image/jpeg',
				'image/jpg',
				'image/webp',
			]
			let imagesFiltered = images.filter(
				image =>
					supportedMimeTypes.includes(image.mime) &&
					(!image.alternativeText || !image.caption)
			)

			// Formater les données pour la réponse
			const formattedImages = imagesFiltered.map(image => ({
				id: image.id,
				name: image.name,
				alternativeText: image.alternativeText,
				caption: image.caption,
				url: image.url,
				folder: image.folder ? image.folder.path : null,
			}))

			ctx.body = {
				data: formattedImages,
				apiKeyIsSet: !!process.env.FORVOYEZ_API_KEY,
			}
		} catch (error) {
			console.error('Error getting images:', error)
			ctx.throw(500, `Error retrieving images: ${error.message}`)
		}
	},

	async process(ctx) {
		try {
			const { imageUrl, imageId } = ctx.request.body

			// Obtenir la description de l'image
			const imageDescription = await strapi
				.plugin('auto-alt-caption-title-on-images-ai-enhanced')
				.service('my-service')
				.getImageDescription(imageUrl)

			// Tronquer les textes pour respecter les limites de la base de données
			const truncatedData = {
				name: imageDescription.name.substring(0, 250),
				alternativeText: imageDescription.alternativeText.substring(0, 250),
				caption: imageDescription.caption.substring(0, 250),
			}

			// Mettre à jour l'image avec les données tronquées
			await strapi.entityService.update('plugin::upload.file', imageId, {
				data: truncatedData,
			})

			ctx.body = {
				message: 'Image processed successfully',
				data: truncatedData,
			}
		} catch (error) {
			console.error('Error processing image:', error)
			ctx.throw(500, `Error processing image: ${error.message}`)
		}
	},
})
