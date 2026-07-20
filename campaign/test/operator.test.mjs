import assert from 'node:assert/strict'
import test from 'node:test'
import {
  acknowledgeOwnerAction,
  addCustomer,
  addOwnerAction,
  createOperatorState,
  dueOwnerAction,
  operatorStatus,
  transitionCustomer,
} from '../operator-core.mjs'

const base = new Date('2026-07-20T15:00:00.000Z')

test('customer references are deterministic and raw external references are not stored', () => {
  const state = createOperatorState(base)
  const first = addCustomer(state, { channel: 'email', externalRef: 'private@example.test', inquirySummary: 'Small phone flow' }, base)
  const second = addCustomer(state, { channel: 'email', externalRef: 'private@example.test', inquirySummary: 'duplicate' }, base)
  assert.equal(first.ref, second.ref)
  assert.equal(state.customers.length, 1)
  assert.equal(JSON.stringify(state).includes('private@example.test'), false)
})

test('customer states cannot be skipped', () => {
  const state = createOperatorState(base)
  const customer = addCustomer(state, { channel: 'email', externalRef: 'a', inquirySummary: 'Starter' }, base)
  assert.throws(() => transitionCustomer(state, {
    ref: customer.ref,
    to: 'paid',
    evidence: { type: 'invoice_paid', reference: 'invoice:1', amountCad: 60 },
  }, base), /Invalid transition/)
})

test('paid requires trusted evidence and a positive amount', () => {
  const state = createOperatorState(base)
  const customer = addCustomer(state, { channel: 'email', externalRef: 'b', inquirySummary: 'Starter' }, base)
  for (const to of ['screened', 'qualified', 'scoped', 'quoted', 'accepted']) {
    transitionCustomer(state, { ref: customer.ref, to, evidence: { type: 'customer_message', reference: `${to}:1` } }, base)
  }
  assert.throws(() => transitionCustomer(state, {
    ref: customer.ref,
    to: 'paid',
    evidence: { type: 'customer_claim', reference: 'message:paid', amountCad: 60 },
  }, base), /trusted financial evidence/)
  transitionCustomer(state, {
    ref: customer.ref,
    to: 'paid',
    evidence: { type: 'invoice_paid', reference: 'invoice:1', amountCad: 60 },
  }, base)
  assert.equal(customer.state, 'paid')
})

test('owner action is idempotent and returns one due action', () => {
  const state = createOperatorState(base)
  const input = {
    actionKey: 'connect-owner-channel',
    title: 'Connect your alert channel',
    reason: 'Hermes cannot reach you yet',
    deadline: '2026-07-20T18:00:00.000Z',
    minutes: 3,
    doneWhen: 'A test alert arrives',
    instruction: 'Open the setup link',
    severity: 'p1',
  }
  const action = addOwnerAction(state, input, base)
  assert.equal(addOwnerAction(state, input, base).id, action.id)
  const due = dueOwnerAction(state, base, true)
  assert.equal(due.id, action.id)
  assert.equal(action.reminderCount, 1)
  assert.equal(action.nextNotificationAt, '2026-07-20T15:15:00.000Z')
})

test('evidence-gated owner actions cannot close on an unsupported done claim', () => {
  const state = createOperatorState(base)
  const action = addOwnerAction(state, {
    title: 'Confirm payment account',
    reason: 'Required to accept payment',
    deadline: '2026-07-21T18:00:00.000Z',
    minutes: 5,
    doneWhen: 'Verified provider event exists',
    instruction: 'Finish provider verification',
    requireEvidence: true,
  }, base)
  assert.throws(() => acknowledgeOwnerAction(state, { id: action.id, outcome: 'done' }, base), /requires completion evidence/)
  acknowledgeOwnerAction(state, { id: action.id, outcome: 'done', evidence: 'provider:event:1' }, base)
  assert.equal(action.status, 'done')
})

test('status contains counts but no customer summaries', () => {
  const state = createOperatorState(base)
  addCustomer(state, { channel: 'email', externalRef: 'c', inquirySummary: 'Secret customer request' }, base)
  const status = operatorStatus(state)
  assert.equal(status.customers.total, 1)
  assert.equal(JSON.stringify(status).includes('Secret customer request'), false)
})
