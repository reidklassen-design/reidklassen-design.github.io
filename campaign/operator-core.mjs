import { createHash } from 'node:crypto'
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const OPERATOR_SCHEMA_VERSION = 1
export const OPERATOR_FILE = 'operator.json'

const DEFAULT_PRIVATE_DIR = new URL('./private/', import.meta.url).pathname
const TRANSITIONS = {
  new_inquiry: ['screened', 'disqualified'],
  screened: ['qualified', 'disqualified'],
  qualified: ['scoped', 'lost'],
  scoped: ['quoted', 'lost'],
  quoted: ['accepted', 'lost'],
  accepted: ['paid', 'lost'],
  paid: ['build_ready', 'refunded', 'disputed'],
  build_ready: ['in_progress', 'refunded', 'disputed'],
  in_progress: ['delivered', 'refunded', 'disputed'],
  delivered: ['accepted_delivery', 'in_progress', 'disputed'],
  accepted_delivery: ['review_requested', 'closed', 'disputed'],
  review_requested: ['closed', 'disputed'],
  disputed: ['refunded', 'closed'],
}
const FINANCIAL_EVIDENCE = new Set([
  'payment_intent_succeeded',
  'marketplace_funded',
  'invoice_paid',
  'bank_record',
])
const TERMINAL_STATES = new Set(['disqualified', 'lost', 'refunded', 'closed'])
const SEVERITY_ORDER = { p0: 0, p1: 1, p2: 2 }

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function identifier(prefix, value) {
  const digest = createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16)
  return `${prefix}_${digest}`
}

function required(input, names) {
  const missing = names.filter((name) => input[name] === undefined || String(input[name]).trim() === '')
  if (missing.length) throw new Error(`Missing required field(s): ${missing.join(', ')}`)
}

function validDate(value, name) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error(`${name} must be a valid date`)
  return parsed
}

export function createOperatorState(now = new Date()) {
  return {
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    createdAt: now.toISOString(),
    customers: [],
    ownerActions: [],
    audit: [],
  }
}

export function operatorPaths(privateDir = DEFAULT_PRIVATE_DIR) {
  return {
    privateDir,
    state: join(privateDir, OPERATOR_FILE),
    lock: join(privateDir, '.operator.lock'),
  }
}

export async function readOperatorState(privateDir = DEFAULT_PRIVATE_DIR, now = new Date()) {
  try {
    const parsed = JSON.parse(await readFile(operatorPaths(privateDir).state, 'utf8'))
    if (parsed.schemaVersion !== OPERATOR_SCHEMA_VERSION) {
      throw new Error(`Unsupported operator schema ${parsed.schemaVersion}`)
    }
    return parsed
  } catch (error) {
    if (error.code === 'ENOENT') return createOperatorState(now)
    throw error
  }
}

export async function writeOperatorState(state, privateDir = DEFAULT_PRIVATE_DIR) {
  const paths = operatorPaths(privateDir)
  await mkdir(paths.privateDir, { recursive: true })
  const temp = `${paths.state}.${process.pid}.tmp`
  await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  await rename(temp, paths.state)
}

export async function withOperatorLock(privateDir, operation) {
  const paths = operatorPaths(privateDir)
  await mkdir(paths.privateDir, { recursive: true })
  let handle
  try {
    handle = await open(paths.lock, 'wx', 0o600)
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Operator state is locked by another process')
    throw error
  }
  try {
    return await operation()
  } finally {
    await handle.close()
    await rm(paths.lock, { force: true })
  }
}

export function addCustomer(state, input, now = new Date()) {
  required(input, ['channel', 'externalRef', 'inquirySummary'])
  const ref = identifier('case', {
    channel: String(input.channel).trim().toLowerCase(),
    externalRef: String(input.externalRef).trim(),
  })
  const existing = state.customers.find((customer) => customer.ref === ref)
  if (existing) return existing
  const customer = {
    ref,
    channel: String(input.channel).trim().toLowerCase(),
    sourceCode: input.sourceCode || null,
    product: input.product || null,
    state: 'new_inquiry',
    inquirySummary: input.inquirySummary,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timeline: [{ at: now.toISOString(), from: null, to: 'new_inquiry', evidence: input.evidence || null }],
  }
  state.customers.push(customer)
  state.audit.push({ at: now.toISOString(), event: 'customer_added', ref })
  return customer
}

export function transitionCustomer(state, input, now = new Date()) {
  required(input, ['ref', 'to'])
  const customer = state.customers.find((entry) => entry.ref === input.ref)
  if (!customer) throw new Error(`Unknown customer case: ${input.ref}`)
  if (TERMINAL_STATES.has(customer.state)) throw new Error(`Customer case is terminal: ${customer.state}`)
  if (!(TRANSITIONS[customer.state] || []).includes(input.to)) {
    throw new Error(`Invalid transition: ${customer.state} -> ${input.to}`)
  }
  if (!input.evidence || !input.evidence.type || !input.evidence.reference) {
    throw new Error('Every transition requires evidence.type and evidence.reference')
  }
  if (input.to === 'paid') {
    if (!FINANCIAL_EVIDENCE.has(input.evidence.type)) throw new Error('Paid requires trusted financial evidence')
    if (!Number.isFinite(Number(input.evidence.amountCad)) || Number(input.evidence.amountCad) <= 0) {
      throw new Error('Paid evidence requires a positive amountCad')
    }
  }
  if (input.to === 'delivered' && input.evidence.type !== 'artifact_delivery') {
    throw new Error('Delivered requires artifact_delivery evidence')
  }
  if (input.to === 'accepted_delivery' && !['customer_acceptance', 'documented_acceptance_term'].includes(input.evidence.type)) {
    throw new Error('Accepted delivery requires customer or contract evidence')
  }
  const from = customer.state
  customer.state = input.to
  customer.updatedAt = now.toISOString()
  customer.timeline.push({ at: now.toISOString(), from, to: input.to, evidence: input.evidence })
  state.audit.push({ at: now.toISOString(), event: 'customer_transition', ref: customer.ref, from, to: input.to })
  return customer
}

export function addOwnerAction(state, input, now = new Date()) {
  required(input, ['title', 'reason', 'deadline', 'minutes', 'doneWhen', 'instruction'])
  const deadline = validDate(input.deadline, 'deadline')
  const severity = input.severity || 'p2'
  if (!(severity in SEVERITY_ORDER)) throw new Error('severity must be p0, p1, or p2')
  const id = identifier('action', input.actionKey || { title: input.title, deadline: deadline.toISOString() })
  const existing = state.ownerActions.find((action) => action.id === id && action.status === 'open')
  if (existing) return existing
  const action = {
    id,
    status: 'open',
    severity,
    category: input.category || 'business_setup',
    title: input.title,
    reason: input.reason,
    deadline: deadline.toISOString(),
    minutes: Number(input.minutes),
    doneWhen: input.doneWhen,
    instruction: input.instruction,
    requireEvidence: Boolean(input.requireEvidence),
    createdAt: now.toISOString(),
    nextNotificationAt: now.toISOString(),
    reminderCount: 0,
  }
  if (!Number.isFinite(action.minutes) || action.minutes <= 0) throw new Error('minutes must be positive')
  state.ownerActions.push(action)
  state.audit.push({ at: now.toISOString(), event: 'owner_action_added', id, severity })
  return action
}

function nextMorning(now) {
  const next = new Date(now)
  next.setDate(next.getDate() + 1)
  next.setHours(9, 0, 0, 0)
  return next
}

function nextNotification(action, now) {
  const deadline = validDate(action.deadline, 'deadline')
  if (action.severity === 'p0') {
    const minutes = action.reminderCount === 1 ? 10 : action.reminderCount === 2 ? 20 : 60
    return new Date(now.getTime() + minutes * 60_000)
  }
  if (action.severity === 'p1') {
    const minutes = action.reminderCount === 1 ? 15 : action.reminderCount === 2 ? 30 : 60
    return new Date(now.getTime() + minutes * 60_000)
  }
  if (action.reminderCount === 1) {
    const twoHours = new Date(now.getTime() + 2 * 60 * 60_000)
    return deadline < twoHours ? deadline : twoHours
  }
  return new Date(now.getTime() + 8 * 60 * 60_000)
}

function localHour(now) {
  const hour = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Edmonton',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now).find((part) => part.type === 'hour')?.value
  return Number(hour)
}

export function dueOwnerAction(state, now = new Date(), advance = false) {
  const due = state.ownerActions
    .filter((action) => action.status === 'open' && validDate(action.nextNotificationAt, 'nextNotificationAt') <= now)
    .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
      || validDate(left.deadline, 'deadline') - validDate(right.deadline, 'deadline'))
  const action = due[0]
  if (!action) return null
  const hour = localHour(now)
  const mayBreakQuietHours = action.severity === 'p0' && ['dispute', 'security', 'legal_deadline'].includes(action.category)
  if ((hour >= 21 || hour < 8) && !mayBreakQuietHours) return null
  if (advance) {
    action.reminderCount += 1
    action.lastNotifiedAt = now.toISOString()
    action.nextNotificationAt = nextNotification(action, now).toISOString()
    state.audit.push({ at: now.toISOString(), event: 'owner_action_notified', id: action.id, reminderCount: action.reminderCount })
  }
  return action
}

export function ownerNotification(action) {
  return [
    `ACTION: ${action.title}`,
    `WHY: ${action.reason}`,
    `DEADLINE: ${action.deadline}`,
    `TIME: ${action.minutes} minutes`,
    `DONE WHEN: ${action.doneWhen}`,
    `DO THIS: ${action.instruction}`,
    `ACTION ID: ${action.id}`,
  ].join('\n')
}

export function acknowledgeOwnerAction(state, input, now = new Date()) {
  required(input, ['id', 'outcome'])
  const action = state.ownerActions.find((entry) => entry.id === input.id)
  if (!action) throw new Error(`Unknown owner action: ${input.id}`)
  if (action.status !== 'open') throw new Error(`Owner action is already ${action.status}`)
  if (!['done', 'skip', 'blocked', 'snooze'].includes(input.outcome)) throw new Error('outcome must be done, skip, blocked, or snooze')
  if (input.outcome === 'done' && action.requireEvidence && !input.evidence) throw new Error('This action requires completion evidence')
  if (input.outcome === 'snooze') {
    action.nextNotificationAt = validDate(input.snoozeUntil, 'snoozeUntil').toISOString()
  } else {
    action.status = input.outcome
    action.closedAt = now.toISOString()
  }
  action.outcomeEvidence = input.evidence || null
  state.audit.push({ at: now.toISOString(), event: 'owner_action_acknowledged', id: action.id, outcome: input.outcome })
  return action
}

export function operatorStatus(state) {
  const customerStates = {}
  for (const customer of state.customers) customerStates[customer.state] = (customerStates[customer.state] || 0) + 1
  return {
    customers: { total: state.customers.length, byState: customerStates },
    ownerActions: {
      open: state.ownerActions.filter((action) => action.status === 'open').length,
      p0: state.ownerActions.filter((action) => action.status === 'open' && action.severity === 'p0').length,
      p1: state.ownerActions.filter((action) => action.status === 'open' && action.severity === 'p1').length,
    },
    auditEvents: state.audit.length,
  }
}
