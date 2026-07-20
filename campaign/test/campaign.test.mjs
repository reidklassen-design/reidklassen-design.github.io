import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  addDnc,
  armMetrics,
  campaignGuard,
  contactHash,
  createBuildCard,
  createInitialState,
  enqueueDraft,
  evolveState,
  persistBuildCard,
  recordEvent,
  sourceCodeFor,
  withStateLock,
  writeState,
} from '../core.mjs'

const start = new Date('2026-07-01T00:00:00.000Z')
const afterGeneration = new Date('2026-07-16T00:00:00.000Z')

function safeDraft(overrides = {}) {
  return {
    armId: 'intent-hunter',
    channel: 'contra',
    leadRef: 'synthetic-lead-1',
    message: 'I can define a focused desktop utility with a clear acceptance test.',
    requestSummary: 'Turn a repeated file task into one action.',
    automatedAction: false,
    ...overrides,
  }
}

function seedMinimumSamples(state) {
  for (const arm of state.currentGeneration.arms) {
    if (arm.type === 'intent') {
      for (let index = 0; index < 12; index += 1) recordEvent(state, { armId: arm.id, event: 'proposal', qualifiedBrief: index < 3, reviewMinutes: 2, quotedCad: index < 2 ? 100 : 0, paymentCad: index === 0 ? 120 : 0 })
    } else if (arm.type === 'proof') {
      for (let index = 0; index < 4; index += 1) recordEvent(state, { armId: arm.id, event: 'post', reviewMinutes: 3 })
      for (let index = 0; index < 12; index += 1) recordEvent(state, { armId: arm.id, event: 'reply', qualifiedBrief: index === 0, reviewMinutes: 1, quotedCad: index === 0 ? 60 : 0 })
    } else {
      for (let index = 0; index < 10; index += 1) recordEvent(state, { armId: arm.id, event: 'partner_approach', reviewMinutes: 2 })
    }
  }
}

test('queue uses deterministic IDs, deduplicates, and never stores the raw contact', () => {
  const state = createInitialState(start)
  const first = enqueueDraft(state, safeDraft({ contactIdentifier: 'Person@Example.test' }), start)
  assert.equal(first.status, 'pending_review')
  assert.equal(first.contactIdentifier, undefined)
  assert.equal(first.sourceCode, 'G1-A-V1')
  assert.equal(sourceCodeFor(state, 'proof-challenge', 2), 'G1-B-V2')
  const duplicate = enqueueDraft(state, safeDraft({ contactIdentifier: 'person@example.test' }), start)
  assert.equal(duplicate.status, 'quarantined')
  assert.ok(duplicate.quarantineReasons.includes('duplicate draft'))
  assert.notEqual(duplicate.id, first.id)
})

test('policy gates quarantine automated protected-channel actions and excluded work', () => {
  const state = createInitialState(start)
  const protectedAction = enqueueDraft(state, safeDraft({ automatedAction: true }), start)
  assert.ok(protectedAction.quarantineReasons.includes('protected channel requires Reid final click'))
  const unsafe = enqueueDraft(state, safeDraft({ leadRef: 'synthetic-lead-2', message: 'Build a high-voltage controller.' }), start)
  assert.ok(unsafe.quarantineReasons.includes('unsafe or excluded work category'))
})

test('DNC is hashed, quarantines queued work, and prevents future contact', () => {
  const state = createInitialState(start)
  enqueueDraft(state, safeDraft({ contactIdentifier: 'stop@example.test' }), start)
  const hash = addDnc(state, 'STOP@example.test', start)
  assert.equal(hash, contactHash('stop@example.test'))
  assert.equal(state.dnc[0].contactHash, hash)
  assert.equal(state.queue[0].status, 'quarantined')
  const blocked = enqueueDraft(state, safeDraft({ leadRef: 'synthetic-lead-3', contactIdentifier: 'stop@example.test' }), start)
  assert.ok(blocked.quarantineReasons.includes('do-not-contact match'))
})

test('only one follow-up can enter the review queue for a contact', () => {
  const state = createInitialState(start)
  const first = enqueueDraft(state, safeDraft({ leadRef: 'follow-up-1', kind: 'follow_up', contactIdentifier: 'followup@example.test' }), start)
  assert.equal(first.status, 'pending_review')
  const second = enqueueDraft(state, safeDraft({ leadRef: 'follow-up-2', kind: 'follow_up', contactIdentifier: 'followup@example.test', message: 'A different second follow-up.' }), start)
  assert.ok(second.quarantineReasons.includes('follow-up limit reached'))
})

test('margin per hour includes cash, model, platform, refund, and human costs', () => {
  const state = createInitialState(start)
  recordEvent(state, { armId: 'intent-hunter', event: 'payment', paymentCad: 100, refundCad: 4, cashSpendCad: 5, modelCostCad: 1, platformFeesCad: 10, reviewMinutes: 30, deliveryMinutes: 30 })
  const metric = armMetrics(state).find((entry) => entry.armId === 'intent-hunter')
  assert.equal(metric.marginCad, 80)
  assert.equal(metric.humanHours, 1)
  assert.equal(metric.marginPerHour, 80)
})

test('cash, active-build, and five-paid guards pause acquisition', () => {
  const cashState = createInitialState(start)
  recordEvent(cashState, { armId: 'intent-hunter', event: 'proposal', cashSpendCad: 24 })
  assert.equal(campaignGuard(cashState, 2).allowed, false)

  const capacityState = createInitialState(start)
  for (let index = 0; index < 4; index += 1) capacityState.buildCards.push({ id: `b${index}`, status: 'active' })
  assert.ok(campaignGuard(capacityState).reasons.includes('active-build capacity reached'))

  const soldState = createInitialState(start)
  for (let index = 0; index < 5; index += 1) recordEvent(soldState, { armId: 'intent-hunter', event: 'payment', projectId: `p${index}`, paymentCad: 40 })
  assert.ok(campaignGuard(soldState).reasons.includes('five-paid-project limit reached'))
})

test('evolution is age/sample gated, preserves two arms, and changes one gene', () => {
  const state = createInitialState(start)
  assert.throws(() => evolveState(state, afterGeneration), /Minimum samples/)
  seedMinimumSamples(state)
  const before = structuredClone(state.currentGeneration.arms)
  const result = evolveState(state, afterGeneration)
  assert.equal(result.nextGeneration, 2)
  assert.equal(result.survivors.length, 2)
  assert.equal(state.currentGeneration.arms.length, 3)
  const winner = before.find((arm) => arm.id === result.survivors[0])
  const changed = Object.keys(winner.genes).filter((key) => winner.genes[key] !== result.challenger.genes[key])
  assert.deepEqual(changed, [result.challenger.mutation.gene])
})

test('every third generation receives a deterministic wildcard', () => {
  const state = createInitialState(start)
  seedMinimumSamples(state)
  evolveState(state, afterGeneration)
  state.currentGeneration.startedAt = '2026-07-16T00:00:00.000Z'
  seedMinimumSamples(state)
  const result = evolveState(state, new Date('2026-08-01T00:00:00.000Z'))
  assert.equal(result.nextGeneration, 3)
  assert.equal(result.challenger.type, 'wildcard')
  assert.equal(result.challenger.mutation.gene, 'all')
})

test('build cards validate input and persist privately', async () => {
  const state = createInitialState(start)
  assert.throws(() => createBuildCard(state, { projectRef: 'x' }), /missing/)
  const card = createBuildCard(state, {
    projectRef: 'synthetic-project',
    outcome: 'Rename image files in one click',
    platform: 'desktop',
    requiredBehaviour: 'Select a folder and apply a naming rule',
    exclusions: ['cloud sync'],
    acceptanceTest: 'Ten fixture files receive the expected names',
    priceCad: 60,
    deadline: '2026-08-01',
  }, start)
  const directory = await mkdtemp(join(tmpdir(), 'campaign-test-'))
  const path = await persistBuildCard(card, directory)
  assert.match(await readFile(path, 'utf8'), /CAD \$60\.00/)
})

test('exclusive state lock rejects concurrent mutation and state is private-mode JSON', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'campaign-lock-'))
  const state = createInitialState(start)
  await writeState(state, directory)
  await withStateLock(directory, async () => {
    await assert.rejects(withStateLock(directory, async () => undefined), /locked/)
  })
  const stored = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8'))
  assert.equal(stored.schemaVersion, 1)
})
