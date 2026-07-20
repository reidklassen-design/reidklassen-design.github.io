import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  businessPrivateDir,
  businessManagerGate,
  businessStatus,
  dueBusinessAction,
  initializeBusinesses,
  readBusinessRegistry,
} from '../business-core.mjs'

const base = new Date('2026-07-20T15:00:00.000Z')

test('business registry contains unique setup-compatible businesses', async () => {
  const registry = await readBusinessRegistry()
  assert.equal(registry.schemaVersion, 1)
  assert.deepEqual(registry.businesses.map((business) => business.slug), ['benchpilot', 'ledgerclean', 'listflow'])
  assert.equal(registry.shared.cashCapCad, 25)
})

test('business private directories are isolated by slug', () => {
  assert.match(businessPrivateDir('benchpilot', '/tmp/private'), /\/tmp\/private\/businesses\/benchpilot$/)
  assert.throws(() => businessPrivateDir('../bad', '/tmp/private'), /Invalid business slug/)
})

test('initialization creates identical state shape and owner actions for every business', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'business-test-'))
  const initialized = await initializeBusinesses({ rootPrivateDir: directory, now: base })
  assert.equal(initialized.businesses.length, 3)
  assert.equal(initialized.businesses.every((business) => business.operator.ownerActions.open === 1), true)
  const status = await businessStatus({ rootPrivateDir: directory, now: base })
  assert.equal(status.totals.openOwnerActions, 3)
  assert.equal(status.totals.p1OwnerActions, 1)
  assert.equal(status.businesses.every((business) => business.campaign.guard.effectiveCashCapCad === 25), true)
})

test('business manager gate stays quiet while owner setup is open', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'business-gate-'))
  await initializeBusinesses({ rootPrivateDir: directory, now: base })
  const gate = await businessManagerGate({ slug: 'benchpilot', rootPrivateDir: directory, now: base })
  assert.equal(gate.wakeAgent, false)
  assert.equal(gate.reason, 'owner_action_open')
  assert.equal(gate.business, 'benchpilot')
})

test('due business action returns the highest-priority setup prompt', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'business-due-'))
  await initializeBusinesses({ rootPrivateDir: directory, now: base })
  const message = await dueBusinessAction({ rootPrivateDir: directory, now: base, advance: true })
  assert.match(message, /^\[BenchPilot\]/)
  assert.match(message, /ACTION: Set up BenchPilot validation/)
})
