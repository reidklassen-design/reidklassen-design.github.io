import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = new URL('../dist/', import.meta.url).pathname
const shell = await readFile(join(dist, 'index.html'), 'utf8')

const sites = [
  {
    slug: 'benchpilot',
    name: 'BenchPilot',
    title: 'BenchPilot | Production Flashing and Test Records',
    description: 'A local production-station pilot for small electronics teams that need firmware flashing, serial numbers, pass/fail checks, and exportable records.',
    color: '#08100d',
    knowsAbout: ['Firmware flashing', 'Production test records', 'Serial-number workflows'],
  },
  {
    slug: 'ledgerclean',
    name: 'LedgerClean',
    title: 'LedgerClean | Recurring CSV Cleanup Pilots',
    description: 'A local workflow pilot for bookkeepers and office teams repeating the same CSV cleanup, validation, dedupe, and import formatting work.',
    color: '#f8f4eb',
    knowsAbout: ['CSV cleanup', 'Import validation', 'Duplicate detection'],
  },
  {
    slug: 'listflow',
    name: 'ListFlow',
    title: 'ListFlow | Bulk Listing Prep Workflows',
    description: 'A shop workflow pilot for small sellers preparing product media, filenames, listing checks, and marketplace-ready upload files.',
    color: '#120917',
    knowsAbout: ['Bulk listing prep', 'Product media workflow', 'Upload file validation'],
  },
]

function attrEscape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function replaceMeta(html, site) {
  const url = `https://reidklassen-design.github.io/${site.slug}/`
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: site.name,
    url,
    applicationCategory: 'BusinessApplication',
    offers: { '@type': 'Offer', priceCurrency: 'CAD' },
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
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="https://reidklassen-design.github.io/product-icons/${site.slug}.svg" />`)
    .replace(/<title>.*<\/title>/, `<title>${site.title}</title>`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
}

for (const site of sites) {
  const directory = join(dist, site.slug)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), replaceMeta(shell, site))
}
