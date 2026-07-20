import { createHash } from 'node:crypto'
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const SCHEMA_VERSION = 1
export const GENERATION_DAYS = 14
export const STATE_FILE = 'state.json'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_PRIVATE_DIR = new URL('./private/', import.meta.url).pathname
const BANNED_PATTERNS = [
  /hack(?:ing|ed)?/i,
  /credential(?:s)?|password|phishing/i,
  /academic cheating|do my homework|write my exam/i,
  /spy|stalk|covert surveillance|privacy invasion/i,
  /weapon|firearm|explosive/i,
  /medical device|diagnos(?:e|is)|life[- ]critical/i,
  /automotive control|brake controller|airbag/i,
  /mains voltage|high[- ]voltage|access control/i,
]
const PROTECTED_CHANNELS = new Set(['linkedin', 'reddit', 'upwork', 'fiverr', 'contra'])
const MUTATIONS = {
  cta: ['Reply with one detail', 'Describe the annoying task', 'Request a fixed scope'],
  audience: ['solo operators', 'small service businesses', 'makers and hardware teams'],
  proof: ['closest relevant build', 'smallest useful version', 'clear acceptance test'],
  channel: ['contra', 'linkedin', 'partner referrals'],
}

export function normalize(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function deterministicId(prefix, value) {
  const digest = createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16)
  return `${prefix}_${digest}`
}

export function contactHash(identifier) {
  return createHash('sha256').update(normalize(identifier)).digest('hex')
}

export function sourceCodeFor(state, armId, variant = 1) {
  const index = state.currentGeneration.arms.findIndex((arm) => arm.id === armId)
  if (index < 0) throw new Error(`Unknown campaign arm: ${armId}`)
  const safeVariant = Number.parseInt(variant, 10)
  if (!Number.isInteger(safeVariant) || safeVariant < 1) throw new Error('Source-code variant must be a positive integer')
  return `G${state.currentGeneration.number}-${String.fromCharCode(65 + index)}-V${safeVariant}`
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function seedArms() {
  return [
    {
      id: 'intent-hunter',
      name: 'Intent Hunter',
      type: 'intent',
      genes: { channel: 'contra', audience: 'active software buyers', pain: 'a defined task needs a focused tool', hook: 'The smallest useful version', proof: 'closest relevant build', priceFrame: 'fixed starter scope', cta: 'Reply with one detail' },
    },
    {
      id: 'proof-challenge',
      name: 'Proof and Challenge',
      type: 'proof',
      genes: { channel: 'linkedin', audience: 'people repeating manual work', pain: 'one annoying repeated task', hook: 'Turn the task into one button', proof: 'smallest useful version', priceFrame: 'founding-client scope', cta: 'Describe the annoying task' },
    },
    {
      id: 'partner-relay',
      name: 'Partner Relay',
      type: 'partner',
      genes: { channel: 'partner referrals', audience: 'complementary providers', pain: 'requests too small for normal projects', hook: 'A reliable home for tiny builds', proof: 'clear acceptance test', priceFrame: 'quote before work', cta: 'Reply menu' },
    },
  ]
}

export function createInitialState(now = new Date()) {
  const startedAt = now.toISOString()
  return {
    schemaVersion: SCHEMA_VERSION,
    campaignId: deterministicId('campaign', 'reid-founding-five-v1'),
    createdAt: startedAt,
    config: {
      currency: 'CAD',
      generationDays: GENERATION_DAYS,
      initialCashCapCad: 25,
      unlockedCashCapCad: 50,
      authorizedCashCapCad: 100,
      maxActiveBuilds: 4,
      maxPaidProjects: 5,
      maxFollowUps: 1,
    },
    currentGeneration: { number: 1, startedAt, arms: seedArms() },
    generations: [],
    ledger: [],
    queue: [],
    dnc: [],
    buildCards: [],
  }
}

export function privatePaths(privateDir = DEFAULT_PRIVATE_DIR) {
  return { privateDir, state: join(privateDir, STATE_FILE), lock: join(privateDir, '.lock'), cards: join(privateDir, 'build-cards') }
}

export async function readState(privateDir = DEFAULT_PRIVATE_DIR, now = new Date()) {
  const { state } = privatePaths(privateDir)
  try {
    const parsed = JSON.parse(await readFile(state, 'utf8'))
    if (parsed.schemaVersion !== SCHEMA_VERSION) throw new Error(`Unsupported state schema ${parsed.schemaVersion}`)
    return parsed
  } catch (error) {
    if (error.code === 'ENOENT') return createInitialState(now)
    throw error
  }
}

export async function writeState(state, privateDir = DEFAULT_PRIVATE_DIR) {
  const paths = privatePaths(privateDir)
  await mkdir(paths.privateDir, { recursive: true })
  const temp = `${paths.state}.${process.pid}.tmp`
  await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  await rename(temp, paths.state)
}

export async function withStateLock(privateDir, operation) {
  const paths = privatePaths(privateDir)
  await mkdir(paths.privateDir, { recursive: true })
  let handle
  try {
    handle = await open(paths.lock, 'wx', 0o600)
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Campaign state is locked by another process')
    throw error
  }
  try {
    return await operation()
  } finally {
    await handle.close()
    await rm(paths.lock, { force: true })
  }
}

export function effectiveCashCap(state) {
  const paid = state.ledger.some((entry) => Number(entry.paymentCad) > 0)
  const paidChannelBriefs = state.ledger.filter((entry) => entry.paidChannel && entry.qualifiedBrief).length
  const expectedRevenue = state.ledger.filter((entry) => entry.paidChannel).reduce((sum, entry) => sum + Number(entry.expectedRevenueCad || 0), 0)
  const paidSpend = state.ledger.filter((entry) => entry.paidChannel).reduce((sum, entry) => sum + Number(entry.cashSpendCad || 0), 0)
  const efficientBriefs = paidChannelBriefs >= 2 && expectedRevenue > 0 && paidSpend / expectedRevenue < 0.2
  return paid || efficientBriefs ? state.config.unlockedCashCapCad : state.config.initialCashCapCad
}

export function campaignGuard(state, proposedCashCad = 0) {
  const paidProjects = new Set(state.ledger.filter((entry) => Number(entry.paymentCad) > 0).map((entry) => entry.projectId || entry.id)).size
  const activeBuilds = state.buildCards.filter((card) => ['paid', 'active'].includes(card.status)).length
  const spent = state.ledger.reduce((sum, entry) => sum + Number(entry.cashSpendCad || 0), 0)
  const cap = effectiveCashCap(state)
  const reasons = []
  if (paidProjects >= state.config.maxPaidProjects) reasons.push('five-paid-project limit reached')
  if (activeBuilds >= state.config.maxActiveBuilds) reasons.push('active-build capacity reached')
  if (spent + Number(proposedCashCad) > cap) reasons.push(`cash cap exceeded (${spent + Number(proposedCashCad)} > ${cap} CAD)`)
  if (spent + Number(proposedCashCad) > state.config.authorizedCashCapCad) reasons.push('authorized cash ceiling exceeded')
  return { allowed: reasons.length === 0, reasons, paidProjects, activeBuilds, spentCad: spent, effectiveCashCapCad: cap }
}

export function evaluateDraft(state, draft) {
  const reasons = []
  const channel = normalize(draft.channel)
  const body = `${draft.subject || ''} ${draft.message || ''} ${draft.requestSummary || ''}`
  const targetHash = draft.contactHash || (draft.contactIdentifier ? contactHash(draft.contactIdentifier) : '')
  if (!draft.armId || !state.currentGeneration.arms.some((arm) => arm.id === draft.armId)) reasons.push('unknown campaign arm')
  if (!channel || !draft.leadRef || !draft.message) reasons.push('channel, leadRef, and message are required')
  if (BANNED_PATTERNS.some((pattern) => pattern.test(body))) reasons.push('unsafe or excluded work category')
  if (draft.automatedAction && PROTECTED_CHANNELS.has(channel)) reasons.push('protected channel requires Reid final click')
  if (targetHash && state.dnc.some((entry) => entry.contactHash === targetHash)) reasons.push('do-not-contact match')
  const recordedFollowUps = state.ledger.filter((entry) => entry.contactHash && entry.contactHash === targetHash && entry.event === 'follow_up').length
  const queuedFollowUps = state.queue.filter((entry) => entry.contactHash && entry.contactHash === targetHash && entry.kind === 'follow_up' && entry.status !== 'quarantined').length
  const priorFollowUps = recordedFollowUps + queuedFollowUps
  if (draft.kind === 'follow_up' && priorFollowUps >= state.config.maxFollowUps) reasons.push('follow-up limit reached')
  const guard = campaignGuard(state, draft.cashSpendCad || 0)
  reasons.push(...guard.reasons)
  const dedupeKey = deterministicId('dedupe', { channel, leadRef: normalize(draft.leadRef), message: normalize(draft.message) })
  if (state.queue.some((item) => item.dedupeKey === dedupeKey) || state.ledger.some((item) => item.dedupeKey === dedupeKey)) reasons.push('duplicate draft')
  return { approvedForHumanReview: reasons.length === 0, reasons: [...new Set(reasons)], dedupeKey, contactHash: targetHash }
}

export function enqueueDraft(state, draft, now = new Date()) {
  const decision = evaluateDraft(state, draft)
  const safeDraft = { ...draft }
  delete safeDraft.contactIdentifier
  delete safeDraft.contactHash
  const sourceCode = draft.sourceCode || (state.currentGeneration.arms.some((arm) => arm.id === draft.armId) ? sourceCodeFor(state, draft.armId, draft.variant || 1) : '')
  const item = {
    id: deterministicId('queue', { generation: state.currentGeneration.number, dedupeKey: decision.dedupeKey, sequence: state.queue.length }),
    generation: state.currentGeneration.number,
    createdAt: now.toISOString(),
    status: decision.approvedForHumanReview ? 'pending_review' : 'quarantined',
    quarantineReasons: decision.reasons,
    dedupeKey: decision.dedupeKey,
    contactHash: decision.contactHash,
    ...safeDraft,
    sourceCode,
  }
  state.queue.push(item)
  return item
}

export function addDnc(state, identifier, now = new Date()) {
  const hash = contactHash(identifier)
  if (!state.dnc.some((entry) => entry.contactHash === hash)) {
    state.dnc.push({ contactHash: hash, addedAt: now.toISOString() })
  }
  for (const item of state.queue.filter((entry) => entry.contactHash === hash && entry.status === 'pending_review')) {
    item.status = 'quarantined'
    item.quarantineReasons = [...new Set([...(item.quarantineReasons || []), 'do-not-contact match'])]
  }
  return hash
}

export function recordEvent(state, event, now = new Date()) {
  const numericFields = ['cashSpendCad', 'modelCostCad', 'platformFeesCad', 'paymentCad', 'refundCad', 'expectedRevenueCad', 'quotedCad', 'reviewMinutes', 'deliveryMinutes']
  const normalized = { ...event }
  for (const field of numericFields) normalized[field] = Number(event[field] || 0)
  normalized.id = event.id || deterministicId('event', { generation: state.currentGeneration.number, sequence: state.ledger.length, ...normalized })
  normalized.generation = event.generation || state.currentGeneration.number
  normalized.createdAt = event.createdAt || now.toISOString()
  state.ledger.push(normalized)
  return normalized
}

export function armMetrics(state, generationNumber = state.currentGeneration.number) {
  return state.currentGeneration.arms.map((arm) => {
    const events = state.ledger.filter((entry) => entry.generation === generationNumber && entry.armId === arm.id)
    const sum = (field) => events.reduce((total, entry) => total + Number(entry[field] || 0), 0)
    const actionCount = events.filter((entry) => ['proposal', 'post', 'reply', 'partner_approach'].includes(entry.event)).length
    const posts = events.filter((entry) => entry.event === 'post').length
    const replies = events.filter((entry) => entry.event === 'reply').length
    const paidBookings = events.filter((entry) => Number(entry.paymentCad) > 0).length
    const marginCad = sum('paymentCad') - sum('refundCad') - sum('cashSpendCad') - sum('modelCostCad') - sum('platformFeesCad')
    const humanHours = (sum('reviewMinutes') + sum('deliveryMinutes')) / 60
    const marginPerHour = humanHours > 0 ? marginCad / humanHours : marginCad > 0 ? marginCad : 0
    const qualifiedBriefs = events.filter((entry) => entry.qualifiedBrief).length
    const sampleMet = paidBookings >= 2 || (arm.type === 'intent' ? events.filter((entry) => entry.event === 'proposal').length >= 12 : arm.type === 'proof' ? posts >= 4 && replies >= 12 : events.filter((entry) => entry.event === 'partner_approach').length >= 10)
    return { armId: arm.id, name: arm.name, actionCount, posts, replies, paidBookings, qualifiedBriefs, quotedCad: sum('quotedCad'), marginCad, humanHours, marginPerHour, sampleMet }
  })
}

function compareMetrics(left, right) {
  return right.marginPerHour - left.marginPerHour || right.qualifiedBriefs / Math.max(right.actionCount, 1) - left.qualifiedBriefs / Math.max(left.actionCount, 1) || right.quotedCad - left.quotedCad || left.armId.localeCompare(right.armId)
}

function mutateWinner(winner, nextGeneration) {
  const geneKeys = ['cta', 'audience', 'proof', 'channel']
  const gene = geneKeys[(nextGeneration - 2) % geneKeys.length]
  const choices = MUTATIONS[gene]
  const current = winner.genes[gene]
  const currentIndex = choices.indexOf(current)
  const value = choices[(currentIndex + 1 + choices.length) % choices.length]
  const genes = { ...winner.genes, [gene]: value }
  return { ...winner, id: deterministicId('mutant', { source: winner.id, nextGeneration, gene, value }), name: `${winner.name} · ${gene} test`, genes, mutation: { sourceArmId: winner.id, gene, from: current, to: value } }
}

function wildcardArm(nextGeneration) {
  return {
    id: deterministicId('wildcard', nextGeneration),
    name: 'Wildcard · Local Utility Audit',
    type: 'wildcard',
    genes: { channel: 'local communities', audience: 'owner-operated local businesses', pain: 'a manual handoff loses time', hook: 'A two-minute workflow audit', proof: 'clear acceptance test', priceFrame: 'fixed starter scope', cta: 'Show me the handoff' },
    mutation: { sourceArmId: null, gene: 'all', from: null, to: 'new challenger' },
  }
}

export function evolveState(state, now = new Date()) {
  const elapsedMs = now.getTime() - new Date(state.currentGeneration.startedAt).getTime()
  if (elapsedMs < state.config.generationDays * DAY_MS) throw new Error(`Generation is not ${state.config.generationDays} days old`)
  const metrics = armMetrics(state)
  if (!metrics.every((entry) => entry.sampleMet)) {
    const missing = metrics.filter((entry) => !entry.sampleMet).map((entry) => entry.name).join(', ')
    throw new Error(`Minimum samples not met: ${missing}`)
  }
  const ranked = [...metrics].sort(compareMetrics)
  const byId = new Map(state.currentGeneration.arms.map((arm) => [arm.id, arm]))
  const survivors = ranked.slice(0, 2).map((metric) => structuredClone(byId.get(metric.armId)))
  const nextNumber = state.currentGeneration.number + 1
  const challenger = nextNumber % 3 === 0 ? wildcardArm(nextNumber) : mutateWinner(survivors[0], nextNumber)
  const allocation = [
    { armId: survivors[0].id, share: 0.4 },
    { armId: survivors[1].id, share: 0.3 },
    { armId: challenger.id, share: 0.3 },
  ]
  state.generations.push({ ...state.currentGeneration, endedAt: now.toISOString(), metrics: ranked, allocation })
  state.currentGeneration = { number: nextNumber, startedAt: now.toISOString(), arms: [...survivors, challenger], allocation }
  return { nextGeneration: nextNumber, ranked, survivors: survivors.map((arm) => arm.id), challenger }
}

export function createBuildCard(state, input, now = new Date()) {
  const required = ['projectRef', 'outcome', 'platform', 'requiredBehaviour', 'acceptanceTest', 'priceCad', 'deadline']
  const missing = required.filter((field) => input[field] === undefined || String(input[field]).trim() === '')
  if (missing.length) throw new Error(`Build card missing: ${missing.join(', ')}`)
  const card = {
    id: deterministicId('build', { projectRef: normalize(input.projectRef), outcome: normalize(input.outcome) }),
    createdAt: now.toISOString(),
    status: input.status || 'quoted',
    outcome: input.outcome,
    platform: input.platform,
    requiredBehaviour: input.requiredBehaviour,
    exclusions: input.exclusions || [],
    acceptanceTest: input.acceptanceTest,
    priceCad: Number(input.priceCad),
    deadline: input.deadline,
    assets: input.assets || [],
    paymentState: input.paymentState || 'unpaid',
    projectRef: input.projectRef,
  }
  if (!Number.isFinite(card.priceCad) || card.priceCad <= 0) throw new Error('Build card priceCad must be positive')
  if (state.buildCards.some((entry) => entry.id === card.id)) throw new Error('Duplicate build card')
  state.buildCards.push(card)
  return card
}

export async function persistBuildCard(card, privateDir = DEFAULT_PRIVATE_DIR) {
  const { cards } = privatePaths(privateDir)
  await mkdir(cards, { recursive: true })
  const lines = [
    `# Build Card ${card.id}`,
    '',
    `- Status: ${card.status}`,
    `- Outcome: ${card.outcome}`,
    `- Platform: ${card.platform}`,
    `- Required behaviour: ${card.requiredBehaviour}`,
    `- Exclusions: ${card.exclusions.length ? card.exclusions.join('; ') : 'None recorded'}`,
    `- Acceptance test: ${card.acceptanceTest}`,
    `- Price: CAD $${card.priceCad.toFixed(2)}`,
    `- Deadline: ${card.deadline}`,
    `- Assets: ${card.assets.length ? card.assets.join('; ') : 'None recorded'}`,
    `- Payment: ${card.paymentState}`,
    '',
  ]
  const path = join(cards, `${card.id}.md`)
  await writeFile(path, lines.join('\n'), { mode: 0o600 })
  return path
}

export function campaignStatus(state, now = new Date()) {
  const guard = campaignGuard(state)
  const generationAgeDays = Math.floor((now.getTime() - new Date(state.currentGeneration.startedAt).getTime()) / DAY_MS)
  return { generation: state.currentGeneration.number, generationAgeDays, guard, metrics: armMetrics(state), queue: { pending: state.queue.filter((item) => item.status === 'pending_review').length, quarantined: state.queue.filter((item) => item.status === 'quarantined').length }, dncCount: state.dnc.length }
}
