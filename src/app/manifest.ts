import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LabelWink',
    short_name: 'LabelWink',
    description: 'LabelWink — Modern Ethnic Fashion',
    start_url: '/',
    display: 'browser', // 'browser' = no install prompt, no PWA
    background_color: '#FDF8F0',
    theme_color: '#1C3829',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
