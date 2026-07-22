export type Project = {
  index: string
  title: string
  eyebrow: string
  description: string
  tags: string[]
  image: string
  alt: string
  tone: 'violet' | 'cyan' | 'amber'
}

export const skills = ['Python', 'React', 'Tauri', 'Interfaces', 'Voice', 'APIs', 'Mobile', 'Firmware']

export const projects: Project[] = [
  {
    index: '01',
    title: 'Atlas Workbench',
    eyebrow: 'Local models · Desktop',
    description: 'A desktop control panel for running and managing local llama.cpp models—without memorizing command-line flags.',
    tags: ['React', 'Tauri', 'llama.cpp'],
    image: '/media/projects/atlas-workbench.webp',
    alt: 'Atlas Workbench desktop interface for configuring and running local models',
    tone: 'violet',
  },
  {
    index: '02',
    title: 'FLUX Studio',
    eyebrow: 'Image generation · GPU',
    description: 'A focused local image-generation studio that brings prompts, models, batches, output, and GPU execution into one polished workflow.',
    tags: ['Python', 'Local inference', 'Image generation'],
    image: '/media/projects/flux-studio.webp',
    alt: 'FLUX Studio interface design showing a four-image generation workspace',
    tone: 'cyan',
  },
  {
    index: '03',
    title: 'RAGdrop',
    eyebrow: 'Knowledge · Local-first',
    description: 'A private knowledge workspace that connects selected files to development tools while keeping source material under your control.',
    tags: ['RAG', 'Developer tools', 'Privacy'],
    image: '/media/projects/ragdrop.webp',
    alt: 'RAGdrop local knowledge workspace showing a sanitized document vault',
    tone: 'amber',
  },
]

export const services = [
  {
    number: '01',
    title: 'Custom phone apps',
    price: 'Founding price · From CAD $60',
    body: 'Start with a free custom screen preview. Builds cover one target platform—iOS or Android—with one focused flow of roughly one to three screens.',
    includes: 'Local data · Source · Test build · One revision',
    limits: 'Accounts, payments, backends, store submission, third-party fees, and continuing support are quoted separately.',
  },
  {
    number: '02',
    title: 'Custom desktop apps',
    price: 'Founding price · From CAD $60',
    body: 'Start with a free custom screen preview. Builds cover one target platform, one window, and one focused local input-to-output workflow.',
    includes: 'Source · Packaged build · One revision',
    limits: 'Multiple platforms, cloud services, extra workflows, and continuing support are quoted separately.',
  },
  {
    number: '03',
    title: 'MCU firmware',
    price: 'Founding price · From CAD $40',
    body: 'One supported development board, one low-voltage peripheral, and one defined behaviour.',
    includes: 'Source · Pinout · Flash notes · One revision',
    limits: 'Client supplies reproducible hardware. Safety-critical, regulated, and high-voltage work is not accepted.',
  },
]

export const process = [
  { step: 'Define', body: 'Make the useful outcome concrete.' },
  { step: 'Build', body: 'Ship the smallest complete system.' },
  { step: 'Prove', body: 'Test it against real-world work.' },
]

export type ProductSite = {
  slug: string
  name: string
  theme: 'bench' | 'ledger' | 'list'
  title: string
  deck: string
  audience: string
  offer: string
  source: string
  proofLabel: string
  cta: string
  steps: string[]
  bullets: string[]
  exclusions: string[]
}

export const productSites: ProductSite[] = [
  {
    slug: 'benchpilot',
    name: 'BenchPilot',
    theme: 'bench',
    title: 'Production flashing without clipboard chaos.',
    deck: 'A local production station for small electronics teams that need firmware flashing, serial numbers, pass/fail tests, and exportable build records.',
    audience: 'For shops shipping ESP32, RP2040, or STM32 devices from a bench, test jig, or small production run.',
    offer: 'Pilot setup from CAD $750',
    source: 'BP-G1-V1',
    proofLabel: 'Validation pilot',
    cta: 'Describe your board',
    steps: ['Connect device', 'Flash firmware', 'Run checks', 'Export record'],
    bullets: ['USB/serial workflow', 'One board family first', 'CSV production history'],
    exclusions: ['No safety-critical devices', 'No broad hardware support', 'No cloud account required'],
  },
  {
    slug: 'ledgerclean',
    name: 'LedgerClean',
    theme: 'ledger',
    title: 'Clean recurring CSV imports before they waste the afternoon.',
    deck: 'A written-workflow pilot for bookkeepers and office teams who repeat the same spreadsheet cleanup before every import.',
    audience: 'For recurring exports with mismatched columns, duplicate rows, validation errors, and import-ready formatting rules.',
    offer: 'Workflow pilot from CAD $500',
    source: 'LC-G1-V1',
    proofLabel: 'Import workflow',
    cta: 'Send a sample cleanup',
    steps: ['Map columns', 'Validate rows', 'Remove duplicates', 'Export clean CSV'],
    bullets: ['One recurring import first', 'Fixture-based acceptance test', 'Local file workflow'],
    exclusions: ['No bookkeeping advice', 'No live bank access', 'No generic spreadsheet replacement'],
  },
  {
    slug: 'listflow',
    name: 'ListFlow',
    theme: 'list',
    title: 'Bulk listing prep without the tab-by-tab grind.',
    deck: 'A shop workflow pilot for sellers who need product media and listing files prepared in one repeatable export.',
    audience: 'For small sellers handling batches of product photos, filenames, listing checks, and marketplace upload files.',
    offer: 'Shop workflow pilot from CAD $750',
    source: 'LF-G1-V1',
    proofLabel: 'Listing batch',
    cta: 'Submit a listing batch',
    steps: ['Normalize media', 'Apply naming rules', 'Check listing fields', 'Export upload file'],
    bullets: ['One marketplace format first', 'Batch photo preparation', 'Upload-ready CSV checks'],
    exclusions: ['No ad management', 'No marketplace policy advice', 'No unlimited format support'],
  },
]
