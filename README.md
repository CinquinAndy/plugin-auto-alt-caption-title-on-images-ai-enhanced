# Strapi Plugin: Auto Alt Caption Title on Images with AI Enhancement

This Strapi plugin automatically generates alternative text (alt), caption, and name for images using AI-powered image analysis. It is designed to enhance the accessibility, SEO, and user experience of your Strapi application by providing meaningful and descriptive information for images.
It use the OpenAI API to generate the alt text, caption and name of the images.

## Why Use This Plugin?

Manually adding alternative text, captions, and names to images can be a time-consuming and tedious task, especially when dealing with a large number of images. This plugin automates the process by leveraging AI image analysis to generate relevant and accurate descriptions for your images.

By using this plugin, you can:

-   Improve accessibility: Alternative text helps users with visual impairments understand the content of images through screen readers or other assistive technologies.
-   Boost SEO: Search engines rely on alternative text and captions to understand the content of images, which can positively impact your website's search rankings.
-   Enhance user experience: Captions and names provide additional context and information about images, enhancing the overall user experience.

## Features

-   Automatically generates alternative text, caption, and name for images using AI-powered image analysis.
-   Supports processing individual images or bulk processing all images at once.
-   Provides a user-friendly interface within the Strapi admin panel to initiate image processing.
-   Displays progress and status updates during the image processing.
-   Allows cancellation of the image processing if needed.
-   Integrates seamlessly with the Strapi Media Library.

## Prerequisites

Before using this plugin, ensure that you have the following:

-   Strapi v4.x installed in your project.
-   An OpenAI API key. You can sign up for an API key at [OpenAI](https://platform.openai.com/signup).

## Installation

1.  Install the plugin in your Strapi project using npm or yarn:
```bash
npm install strapi-plugin-auto-alt-caption-title-on-images-ai-enhanced 
```
or
```bash
yarn add strapi-plugin-auto-alt-caption-title-on-images-ai-enhanced
```
2. Enable the plugin in your Strapi configuration file (config/plugins.js):
```javascript
module.exports = {
  // ...
  'auto-alt-caption-title-on-images-ai-enhanced': {
    enabled: true,
  },
  // ...
};
```
3. Add your OpenAI API key to the Strapi environment variables file (`.env`):
```json
OPENAI_API_KEY=your-api-key
```
4. Rebuild your Strapi admin panel:
```bash
npm run build
```
5. Restart your Strapi server:
```bash
npm run develop
```

## Usage

1.  Access the plugin within the Strapi admin panel by navigating to the "Auto Alt Caption Title on Images" section.
2.  The plugin will display a list of images from your Strapi Media Library that do not have alternative text, caption, or name.
3.  To process a single image, click on the desired image. The plugin will initiate the AI-powered image analysis and generate the alternative text, caption, and name for that specific image.
4.  To process all images at once, click the "Process All Images" button. The plugin will start analyzing and generating descriptions for all the images in the list.
5.  During the image processing, you can monitor the progress through the progress bar and status messages.
6.  If needed, you can cancel the image processing by clicking the "Cancel" button. This will stop the processing of the remaining images, but will not revert the changes made to the already processed images.
7.  Once the image processing is complete, the generated alternative text, caption, and name will be automatically saved for each image in the Strapi Media Library.

## Troubleshooting

-   If you encounter any issues or errors during the installation or usage of the plugin, please ensure that you have followed the installation steps correctly and have provided a valid OpenAI API key.
-   If the image processing fails or takes an unusually long time, check your OpenAI API usage and limits. Ensure that you have sufficient credits and that your API key is valid.
-   If you experience any other problems or have questions, please feel free to open an issue on the plugin's GitHub repository.

## Contributing

Contributions to this plugin are welcome! If you find any bugs, have feature requests, or want to contribute improvements, please submit an issue or a pull request on the plugin's GitHub repository.

When contributing, please ensure that you follow the existing code style and conventions, and provide clear and concise descriptions of your changes.

## License

This plugin is released under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute it according to the terms of the license.

## Acknowledgements

This plugin was developed using the powerful capabilities of the OpenAI API and the Strapi framework. We would like to express our gratitude to the OpenAI team for their innovative AI technology and to the Strapi community for their excellent headless CMS solution.

## Contact

If you have any questions, suggestions, or feedback regarding this plugin, please feel free to contact us at contact@andy-cinquin.fr or visit our website at andy-cinquin.com

We hope you find this plugin useful and that it enhances your Strapi application's image handling capabilities!
