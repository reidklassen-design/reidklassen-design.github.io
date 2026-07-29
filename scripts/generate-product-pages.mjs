import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = new URL('../dist/', import.meta.url).pathname
const shell = await readFile(join(dist, 'index.html'), 'utf8')

const sites = [
  {
    slug: 'benchpilot',
    name: 'BenchPilot',
    title: 'BenchPilot | Custom MCU Firmware',
    description: 'Custom firmware for ESP32, RP2040, and STM32 boards. Starter jobs from CAD $40: one board, one low-voltage peripheral, one behaviour, source, pinout, flash notes, and one revision.',
    color: '#08100d',
    type: 'ProfessionalService',
    price: '40.00',
    knowsAbout: ['Custom MCU firmware', 'ESP32', 'RP2040', 'STM32'],
  },
  {
    slug: 'ledgerclean',
    name: 'LedgerClean',
    title: 'LedgerClean | Recurring CSV Cleanup Pilots',
    description: 'A local workflow pilot for bookkeepers and office teams repeating the same CSV cleanup, validation, dedupe, and import formatting work.',
    color: '#f8f4eb',
    socialImage: '/product-social/ledgerclean.png',
    type: 'ProfessionalService',
    price: '500.00',
    knowsAbout: ['CSV cleanup', 'Import validation', 'Duplicate detection'],
  },
  {
    slug: 'listflow',
    name: 'ListFlow',
    title: 'ListFlow | Bulk Listing Prep Workflows',
    description: 'A shop workflow pilot for small sellers preparing product media, filenames, listing checks, and marketplace-ready upload files.',
    color: '#120917',
    socialImage: '/product-social/listflow.png',
    knowsAbout: ['Bulk listing prep', 'Product media workflow', 'Upload file validation'],
  },
]

function attrEscape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function replaceMeta(html, site) {
  const url = `https://reidklassen-design.github.io/${site.slug}/`
  const socialImage = site.socialImage
    ? `https://reidklassen-design.github.io${site.socialImage}`
    : `https://reidklassen-design.github.io/product-icons/${site.slug}.svg`
  const socialImageMeta = site.socialImage
    ? `<meta property="og:image" content="${socialImage}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta name="twitter:image" content="${socialImage}" />`
    : `<meta property="og:image" content="${socialImage}" />`
  const ld = {
    '@context': 'https://schema.org',
    '@type': site.type ?? 'SoftwareApplication',
    name: site.name,
    url,
    ...(site.type ? { description: site.description, areaServed: 'CA' } : { applicationCategory: 'BusinessApplication' }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      ...(site.price ? { price: site.price, description: site.description } : {}),
    },
    knowsAbout: site.knowsAbout,
  }
  return html
    .replace(/<meta name="theme-color" content="[^"]*" \/>/, `<meta name="theme-color" content="${site.color}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${attrEscape(site.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<link rel="icon" href="[^"]*" type="image\/svg\+xml" \/>/, `<link rel="icon" href="/product-icons/${site.slug}.svg" type="image/svg+xml" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${attrEscape(site.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${attrEscape(site.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, socialImageMeta)
    .replace(/<title>.*<\/title>/, `<title>${site.title}</title>`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
}

for (const site of sites) {
  const directory = join(dist, site.slug)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), replaceMeta(shell, site))
}
