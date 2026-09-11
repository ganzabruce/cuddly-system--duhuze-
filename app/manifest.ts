import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: 'Duhuze RSVP',
    short_name: 'Duhuze',
    description: 'RSVP & Event Management Made Simple',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf9f6',
    theme_color: '#1a1412',
    icons: [
      {
        src: '/logos/icon-512-masked-white.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logos/icon-512-masked-white.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
