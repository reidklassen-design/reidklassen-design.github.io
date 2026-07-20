import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { campaignStatus, privatePaths, readState, withStateLock, writeState } from './core.mjs'
import {
  addOwnerAction,
  dueOwnerAction,
  operatorPaths,
  ownerNotification,
  operatorStatus,
  readOperatorState,
  withOperatorLock,
  writeOperatorState,
} from './operator-core.mjs'

export const BUSINESS_SCHEMA_VERSION = 1

const ROOT = dirname(fileURLToPath(import.meta.url))
const REGISTRY = join(ROOT, 'businesses.json')
const DEFAULT_PRIVATE = new URL('./private/', import.meta.url).pathname

function assertSlug(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(slug)) throw new Error(`Invalid business slug: ${slug}`)
}

export async function readBusinessRegistry(path = REGISTRY) {
  const registry = JSON.parse(await readFile(path, 'utf8'))
  if (registry.schemaVersion !== BUSINESS_SCHEMA_VERSION) {
    throw new Error(`Unsupported business registry schema ${registry.schemaVersion}`)
  }
  const seen = new Set()
  for (const business of registry.businesses || []) {
    assertSlug(business.slug)
    if (seen.has(business.slug)) throw new Error(`Duplicate business slug: ${business.slug}`)
    seen.add(business.slug)
  }
  return registry
}

export function businessPrivateDir(slug, rootPrivateDir = DEFAULT_PRIVATE) {
  assertSlug(slug)
  return join(rootPrivateDir, 'businesses', slug)
}

export function businessBySlug(registry, slug) {
  const business = registry.businesses.find((entry) => entry.slug === slug)
  if (!business) throw new Error(`Unknown business: ${slug}`)
  return business
}

function businessMetadata(business, registry) {
  return {
    slug: business.slug,
    name: business.name,
    category: business.category,
    customer: business.customer,
    promise: business.promise,
    validationGate: business.validationGate,
    cashCapCad: registry.shared.cashCapCad,
  }
}

function setupActionFor(business, now) {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60_000)
  return {
    actionKey: `${business.slug}:setup:v1`,
    severity: business.slug === 'benchpilot' ? 'p1' : 'p2',
    category: 'business_setup',
    title: `Set up ${business.name} validation`,
    reason: `${business.name} needs one narrow validation target before Hermes spends research time or asks for payment.`,
    deadline: tomorrow.toISOString(),
    minutes: business.slug === 'benchpilot' ? 5 : 3,
    doneWhen: 'The first target workflow and any required human choice are recorded in private state.',
    instruction: `${business.primaryHumanDecision} Do not build the product yet; this only authorizes validation research and paid-pilot setup.`,
    requireEvidence: false,
  }
}

export async function initializeBusiness(business, registry, rootPrivateDir = DEFAULT_PRIVATE, now = new Date()) {
  const privateDir = businessPrivateDir(business.slug, rootPrivateDir)
  const campaign = await withStateLock(privateDir, async () => {
    const state = await readState(privateDir, now)
    state.business = businessMetadata(business, registry)
    state.config.initialCashCapCad = registry.shared.cashCapCad
    state.config.unlockedCashCapCad = Math.max(state.config.unlockedCashCapCad, registry.shared.cashCapCad)
    await writeState(state, privateDir)
    return campaignStatus(state, now)
  })
  const operator = await withOperatorLock(privateDir, async () => {
    const state = await readOperatorState(privateDir, now)
    state.business = businessMetadata(business, registry)
    addOwnerAction(state, setupActionFor(business, now), now)
    await writeOperatorState(state, privateDir)
    return operatorStatus(state)
  })
  return { slug: business.slug, name: business.name, privateDir, campaign, operator }
}

export async function initializeBusinesses({ slug, rootPrivateDir = DEFAULT_PRIVATE, now = new Date() } = {}) {
  const registry = await readBusinessRegistry()
  const selected = slug ? [businessBySlug(registry, slug)] : registry.businesses
  const results = []
  for (const business of selected) {
    results.push(await initializeBusiness(business, registry, rootPrivateDir, now))
  }
  return { shared: registry.shared, businesses: results }
}

async function summarizeOne(business, registry, rootPrivateDir, now) {
  const privateDir = businessPrivateDir(business.slug, rootPrivateDir)
  const campaignState = await readState(privateDir, now)
  const operatorState = await readOperatorState(privateDir, now)
  if (!campaignState.business) campaignState.business = businessMetadata(business, registry)
  if (!operatorState.business) operatorState.business = businessMetadata(business, registry)
  return {
    slug: business.slug,
    name: business.name,
    category: business.category,
    validationGate: business.validationGate,
    campaign: campaignStatus(campaignState, now),
    operator: operatorStatus(operatorState),
  }
}

export async function businessStatus({ slug, rootPrivateDir = DEFAULT_PRIVATE, now = new Date() } = {}) {
  const registry = await readBusinessRegistry()
  const selected = slug ? [businessBySlug(registry, slug)] : registry.businesses
  const businesses = []
  for (const business of selected) {
    businesses.push(await summarizeOne(business, registry, rootPrivateDir, now))
  }
  const totals = businesses.reduce((summary, business) => ({
    pendingReview: summary.pendingReview + business.campaign.queue.pending,
    openOwnerActions: summary.openOwnerActions + business.operator.ownerActions.open,
    p1OwnerActions: summary.p1OwnerActions + business.operator.ownerActions.p1,
    paidProjects: summary.paidProjects + business.campaign.guard.paidProjects,
    spentCad: summary.spentCad + business.campaign.guard.spentCad,
  }), { pendingReview: 0, openOwnerActions: 0, p1OwnerActions: 0, paidProjects: 0, spentCad: 0 })
  return { shared: registry.shared, totals, businesses }
}

export async function dueBusinessAction({ advance = false, rootPrivateDir = DEFAULT_PRIVATE, now = new Date() } = {}) {
  const registry = await readBusinessRegistry()
  for (const business of registry.businesses) {
    const privateDir = businessPrivateDir(business.slug, rootPrivateDir)
    if (advance) {
      const action = await withOperatorLock(privateDir, async () => {
        const state = await readOperatorState(privateDir, now)
        const due = dueOwnerAction(state, now, true)
        await writeOperatorState(state, privateDir)
        return due
      })
      if (action) return `[${business.name}]\n${ownerNotification(action)}`
    } else {
      const state = await readOperatorState(privateDir, now)
      const action = dueOwnerAction(state, now, false)
      if (action) return `[${business.name}]\n${ownerNotification(action)}`
    }
  }
  return ''
}

export async function businessManagerGate({ slug, rootPrivateDir = DEFAULT_PRIVATE, now = new Date() }) {
  const status = await businessStatus({ slug, rootPrivateDir, now })
  const business = status.businesses[0]
  if (!business) return { wakeAgent: false, reason: 'unknown_business' }
  if (business.operator.ownerActions.open > 0) {
    return {
      wakeAgent: false,
      reason: 'owner_action_open',
      business: business.slug,
      openOwnerActions: business.operator.ownerActions.open,
    }
  }
  if (!business.campaign.guard.allowed) {
    return {
      wakeAgent: false,
      reason: 'campaign_guard',
      business: business.slug,
      details: business.campaign.guard.reasons,
    }
  }
  return {
    wakeAgent: true,
    business,
    maximumToolCalls: 5,
    maximumCandidates: 5,
    instruction: 'Run one validation-first control loop for this one business only. Do not act for any other business.',
  }
}

export { privatePaths, operatorPaths }
