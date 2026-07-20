import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173'
const outputDir = new URL('../verification/site/', import.meta.url)
await mkdir(outputDir, { recursive: true })

const targets = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'phone-390x844', width: 390, height: 844 },
]

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true })
const failures = []

for (const target of targets) {
  const context = await browser.newContext({ viewport: target, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('pageerror', (error) => failures.push(`${target.name}: page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`${target.name}: console error: ${message.text()}`)
  })

  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' })
  if (!response?.ok()) failures.push(`${target.name}: page returned ${response?.status() ?? 'no response'}`)
  await page.evaluate(() => document.fonts.ready)
  const images = await page.locator('img').all()
  for (const image of images) {
    await image.scrollIntoViewIfNeeded()
    await image.evaluate((element) => element.decode())
  }
  await page.evaluate(() => window.scrollTo(0, 0))

  const audit = await page.evaluate(() => ({
    title: document.title,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
    sections: ['work', 'services', 'process', 'contact'].filter((id) => !document.getElementById(id)),
    github: document.querySelector('a[href="https://github.com/reidklassen-design"]')?.getAttribute('href'),
    contactButtons: document.querySelectorAll('button.header-contact, button.button.primary, button.contact-link').length,
  }))

  if (audit.title !== 'See Your Custom App Before You Build It') failures.push(`${target.name}: unexpected title`)
  if (audit.horizontalOverflow > 1) failures.push(`${target.name}: horizontal overflow ${audit.horizontalOverflow}px`)
  if (audit.brokenImages.length) failures.push(`${target.name}: broken images: ${audit.brokenImages.join(', ')}`)
  if (audit.sections.length) failures.push(`${target.name}: missing sections: ${audit.sections.join(', ')}`)
  if (!audit.github) failures.push(`${target.name}: GitHub link missing`)
  if (audit.contactButtons !== 3) failures.push(`${target.name}: expected 3 email CTAs, found ${audit.contactButtons}`)

  await page.locator('.project-media').first().click()
  if (!(await page.getByRole('dialog').isVisible())) failures.push(`${target.name}: lightbox did not open`)
  await page.keyboard.press('Escape')
  if (await page.getByRole('dialog').isVisible().catch(() => false)) failures.push(`${target.name}: lightbox did not close with Escape`)

  await page.screenshot({ path: new URL(`${target.name}.png`, outputDir).pathname, fullPage: true })
  await context.close()
}

const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const reducedPage = await reducedContext.newPage()
await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' })
const transitionDuration = await reducedPage.locator('.button').first().evaluate((element) => getComputedStyle(element).transitionDuration)
if (!['0.00001s', '1e-05s'].includes(transitionDuration)) failures.push(`reduced motion: unexpected transition duration ${transitionDuration}`)
await reducedContext.close()
await browser.close()

if (failures.length) {
  console.error('Portfolio browser verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Portfolio browser verification passed at ${targets.length} target sizes.`)
