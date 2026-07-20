#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import {
  addDnc,
  campaignStatus,
  createBuildCard,
  enqueueDraft,
  evolveState,
  persistBuildCard,
  privatePaths,
  readState,
  recordEvent,
  withStateLock,
  writeState,
} from './core.mjs'

const [command = 'help', ...args] = process.argv.slice(2)
const privateDir = process.env.CAMPAIGN_PRIVATE_DIR || privatePaths().privateDir

function argument(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function print(value) {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`)
}

async function inputJson() {
  const path = argument('--input')
  if (!path) throw new Error('--input <private-json-file> is required')
  return JSON.parse(await readFile(path, 'utf8'))
}

async function mutate(operation) {
  return withStateLock(privateDir, async () => {
    const state = await readState(privateDir)
    const result = await operation(state)
    await writeState(state, privateDir)
    return result
  })
}

try {
  switch (command) {
    case 'test': {
      const testFile = new URL('./test/campaign.test.mjs', import.meta.url).pathname
      const result = spawnSync(process.execPath, ['--test', testFile], { stdio: 'inherit' })
      process.exitCode = result.status ?? 1
      break
    }
    case 'status': {
      print(campaignStatus(await readState(privateDir)))
      break
    }
    case 'review': {
      const state = await readState(privateDir)
      const pending = state.queue.filter((item) => item.status === 'pending_review')
      print({ guard: campaignStatus(state).guard, pendingCount: pending.length, pending })
      break
    }
    case 'evolve': {
      const result = await mutate((state) => evolveState(state))
      print(result)
      break
    }
    case 'queue:add': {
      const draft = await inputJson()
      print(await mutate((state) => enqueueDraft(state, draft)))
      break
    }
    case 'event:add': {
      const event = await inputJson()
      print(await mutate((state) => recordEvent(state, event)))
      break
    }
    case 'dnc:add': {
      const identifier = argument('--identifier')
      if (!identifier) throw new Error('--identifier is required; it is hashed before storage')
      print({ contactHash: await mutate((state) => addDnc(state, identifier)) })
      break
    }
    case 'build-card': {
      const input = await inputJson()
      const card = await mutate((state) => createBuildCard(state, input))
      print({ card, path: await persistBuildCard(card, privateDir) })
      break
    }
    case 'help':
      print(`Campaign CLI

  test
  status
  review
  evolve
  queue:add --input <private-json-file>
  event:add --input <private-json-file>
  dnc:add --identifier <contact>
  build-card --input <private-json-file>

All state stays under campaign/private unless CAMPAIGN_PRIVATE_DIR is set.`)
      break
    default:
      throw new Error(`Unknown command: ${command}`)
  }
} catch (error) {
  process.stderr.write(`campaign: ${error.message}\n`)
  process.exitCode = 1
}
