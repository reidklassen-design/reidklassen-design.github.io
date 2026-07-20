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
  { number: '01', title: 'Custom phone apps', price: 'Founding offer · Starting at $60', body: 'A focused first version for your idea, workflow, or business—designed to feel clear, fast, and genuinely useful.' },
  { number: '02', title: 'Custom desktop apps', price: 'Founding offer · Starting at $60', body: 'A focused first version with a polished interface, direct system access, and no unnecessary complexity.' },
  { number: '03', title: 'MCU firmware', price: 'Founding offer · Starting at $40', body: 'Practical firmware for sensors, controls, connected devices, prototypes, and small embedded systems.' },
]

export const process = [
  { step: 'Define', body: 'Make the useful outcome concrete.' },
  { step: 'Build', body: 'Ship the smallest complete system.' },
  { step: 'Prove', body: 'Test it against real-world work.' },
]
