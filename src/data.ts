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
    body: 'One target platform—iOS or Android—with one focused flow of roughly one to three screens.',
    includes: 'Local data · Source · Test build · One revision',
    limits: 'Accounts, payments, backends, store submission, third-party fees, and continuing support are quoted separately.',
  },
  {
    number: '02',
    title: 'Custom desktop apps',
    price: 'Founding price · From CAD $60',
    body: 'One target platform, one window, and one focused local input-to-output workflow.',
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
