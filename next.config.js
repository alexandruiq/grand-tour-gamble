/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  webpack: (config) => {
    // Add MDX support
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [],
            rehypePlugins: [],
          },
        },
      ],
    });

    // Add JSON support for themes
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });

    return config;
  },
}

module.exports = nextConfig