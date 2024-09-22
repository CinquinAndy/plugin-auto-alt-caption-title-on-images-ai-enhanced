import React, { useEffect, useState } from 'react'
import { Button } from '@strapi/design-system/Button'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ProgressBar } from '@strapi/design-system/ProgressBar'
import { Loader } from '@strapi/design-system/Loader'
import { Typography } from '@strapi/design-system'
import { Box } from '@strapi/design-system/Box'
import { Rocket } from '@strapi/icons'

const HomePage = () => {
	const [response, setResponse] = useState('')
	const [dataImages, setDataImages] = useState([])
	const [progress, setProgress] = useState(0)
	const [processing, setProcessing] = useState(false)
	const [abortController, setAbortController] = useState(null)
	const [processingImages, setProcessingImages] = useState([])
	const [apiKeyIsSet, setApiKeyIsSet] = useState(false)

	useEffect(() => {
		// Fetch image data on component mount
		const fetchPromise = fetch(
			`${strapi.backendURL}/auto-alt-caption-title-on-images-ai-enhanced/images`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${sessionStorage.getItem('jwtToken')}`,
				},
			}
		)

		toast.promise(
			fetchPromise,
			{
				pending: 'Fetching image data...',
				success: 'Image data fetched successfully!',
				error: 'Error fetching image data!',
			},
			{
				position: 'bottom-right',
			}
		)

		fetchPromise
			.then(res => {
				if (res.ok) {
					return res.json()
				} else {
					throw new Error(res.statusText)
				}
			})
			.then(data => {
				// Filter out null values from data.data
				const dataFiltered = data.data.filter(image => image)
				setApiKeyIsSet(data.apiKeyIsSet)
				setDataImages(dataFiltered)
			})
			.catch(error => {
				console.error('Error:', error)
			})
	}, [])

	const processImage = async image => {
		// Process a single image
		const fetchPromise = fetch(
			`${strapi.backendURL}/auto-alt-caption-title-on-images-ai-enhanced/process`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${sessionStorage.getItem('jwtToken')}`,
				},
				body: JSON.stringify({
					imageUrl: image?.url,
					imageId: image?.id,
				}),
			}
		)

		toast.promise(
			fetchPromise,
			{
				pending: 'Processing image...',
				success: 'Image processed successfully!',
				error: 'Error processing image!',
			},
			{
				position: 'bottom-right',
			}
		)

		try {
			const res = await fetchPromise

			if (res.ok) {
				const data = await res.json()
				setResponse(data.message)
				console.info(
					'{' +
						'\n  "name": "' +
						data.data.name +
						'",' +
						'\n  "alternativeText": "' +
						data.data.alternativeText +
						'",' +
						'\n  "caption": "' +
						data.data.caption +
						'"' +
						'\n}'
				)
				// Remove the processed image from the list
				setDataImages(prevImages =>
					prevImages.filter(img => img.id !== image.id)
				)
			} else {
				throw new Error(res.statusText)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}

	/**
	 * Handle click event for processing all the images
	 * @returns {Promise<void>}
	 */
	const handleProcessAll = async () => {
		setProcessing(true)
		setProcessingImages(dataImages.map(image => image.id))
		const totalImages = dataImages.length
		const reversedImages = [...dataImages].reverse()
		const controller = new AbortController()
		setAbortController(controller)

		for (let i = 0; i < totalImages; i++) {
			if (controller.signal.aborted) break
			const image = reversedImages[i]
			await processImage(image)
			setDataImages(prevImages => prevImages.slice(0, -1))
			setProgress(((i + 1) / totalImages) * 100)
		}

		setProcessing(false)
		setAbortController(null)
		setProcessingImages([])
	}

	/**
	 * Handle click event to cancel the analysis process
	 */
	const handleCancel = () => {
		if (abortController) {
			abortController.abort()
			setProcessing(false)
			setAbortController(null)
			setProcessingImages(prevProcessingImages => [
				prevProcessingImages[prevProcessingImages.length - 1],
			])
			toast.info('Analysis canceled', {
				position: 'bottom-right',
			})
		}
	}

	/**
	 * Handle click event for processing a single image
	 * @param image
	 * @returns {Promise<void>}
	 */
	const handleProcessImage = async image => {
		// Process a single image on click
		setProcessingImages(prevProcessingImages => [
			...prevProcessingImages,
			image.id,
		])
		await processImage(image)
		setProcessingImages(prevProcessingImages =>
			prevProcessingImages.filter(id => id !== image.id)
		)
	}

	return (
		<>
			{/* style for the blur effect */}
			<style>
				{`
          .hover-blur:hover {
            filter: blur(2px);
          }
        `}
			</style>
			<ToastContainer />
			<div
				style={{
					width: '100%',
					height: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'start',
					alignItems: 'start',
					position: 'relative',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
					}}
				>
					<Box paddingTop={'2rem'} paddingLeft={'4rem'}>
						<Typography variant="alpha">
							Plugin: Auto process alt text, caption, and title on images using
							AI
						</Typography>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
							}}
						>
							<p>
								Click the button below to trigger the plugin function (analyse &
								process all images, and fill all your missing alternative text,
								caption, and name).
							</p>
							<p
								style={{
									opacity: 0.8,
									fontSize: '0.875rem',
									fontStyle: 'italic',
								}}
							>
								⚠️ If you want process and fill the alternative text, caption,
								and name, on JUST ONE image, just click on the image. ⚠️
							</p>
							<p
								style={{
									opacity: 0.8,
									fontSize: '0.875rem',
									fontStyle: 'italic',
								}}
							>
								⚠️ Don't close this page when you process your images ⚠️
							</p>
							{!apiKeyIsSet && (
								<div
									style={{
										backgroundColor: '#f8f8f8',
										padding: '1rem',
										borderRadius: '4px',
										border: '1px solid red',
										display: 'flex',
										flexDirection: 'column',
										gap: '0.5rem',
									}}
								>
									<p>
										⛔ You need to have an API key from ForVoyez to use this
										plugin. You can get one by signing up at{' '}
										<a
											href="https://forvoyez.com/app/tokens"
											target="_blank"
											rel="noreferrer"
										>
											ForVoyez
										</a>
										.
									</p>
									<p>
										and then you need to add the API key to the .env file in the
										root of your Strapi project. The key should be named
										FORVOYEZ_API_KEY
									</p>
								</div>
							)}
						</div>
					</Box>
					<div
						style={{
							position: 'absolute',
							right: '4rem',
							top: '2rem',
							display: 'flex',
							gap: '1rem',
							justifyContent: 'end',
						}}
					>
						{processing ? (
							<Button onClick={handleCancel}>Cancel</Button>
						) : (
							<Button
								onClick={handleProcessAll}
								startIcon={<Rocket />}
								size={'L'}
							>
								Process all images
							</Button>
						)}
					</div>
				</div>
				{processing && (
					<div
						style={{
							display: 'flex',
							width: '100%',
							padding: '2rem 4rem',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
							}}
						>
							<p>Processing images... {progress.toFixed(2)}%</p>
							<ProgressBar
								value={progress}
								size="L"
								style={{
									border: '1px solid #000',
									borderRadius: '4px',
									width: '300px',
									height: '14px',
								}}
							/>
						</div>
					</div>
				)}
				<div
					style={{
						display: 'flex',
						width: '100%',
						padding: '2rem 0 0 4rem',
						justifyContent: '',
					}}
				>
					<p>
						Images that haven't content yet ({dataImages.length || 0} image.s):
					</p>
				</div>
				<div
					style={{
						display: 'flex',
						width: '100%',
						padding: '1rem 4rem',
						justifyContent: 'center',
					}}
				>
					<ul
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
							width: '100%',
							gap: '1rem',
						}}
					>
						{dataImages.map(image => {
							if (!image) return null
							const isProcessing = processingImages.includes(image.id)
							return (
								<li
									key={image?.id}
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '0.5rem',
									}}
								>
									<div
										style={{
											position: 'relative',
											width: '100px',
											height: '100px',
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
										}}
									>
										<img
											src={image?.url}
											alt={image?.alternativeText}
											style={{
												width: '100%',
												height: '100%',
												position: 'absolute',
												zIndex: 1,
												objectFit: 'cover',
												objectPosition: 'center',
												opacity: isProcessing ? 0.5 : 1,
												cursor: 'pointer',
												transition: 'all 0.3s ease-in-out',
											}}
											className={'hover-blur'}
											onClick={() => handleProcessImage(image)}
										/>
										{isProcessing && (
											<div
												style={{
													position: 'absolute',
													top: 0,
													left: 0,
													width: '100%',
													height: '100%',
													backgroundColor: 'rgba(0, 0, 0, 0.5)',
													display: 'flex',
													justifyContent: 'center',
													alignItems: 'center',
													zIndex: 2,
												}}
											>
												<div
													style={{
														width: '100%',
														height: '100%',
														position: 'absolute',
														top: 0,
														left: 0,
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'center',
														alignItems: 'center',
														padding: '0.5rem',
														backgroundColor: 'rgba(0, 0, 0, 0.8)',
														borderRadius: '4px',
													}}
												>
													<Loader small>Processing...</Loader>
												</div>
											</div>
										)}
									</div>
									<p>
										{
											// Display the image name, truncate if it's too long (max 15 characters)
											image?.name.length > 15
												? `${image?.name.substring(0, 15)}...`
												: image?.name
										}
									</p>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		</>
	)
}

export default HomePage
