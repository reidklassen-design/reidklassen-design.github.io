#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import {
  acknowledgeOwnerAction,
  addCustomer,
  addOwnerAction,
  dueOwnerAction,
  operatorPaths,
  operatorStatus,
  ownerNotification,
  readOperatorState,
  transitionCustomer,
  withOperatorLock,
  writeOperatorState,
} from './operator-core.mjs'

const [command = 'help', ...args] = process.argv.slice(2)
const privateDir = process.env.CAMPAIGN_PRIVATE_DIR || operatorPaths().privateDir

function argument(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

async function inputJson() {
  const path = argument('--input')
  if (!path) throw new Error('--input <private-json-file> is required')
  return JSON.parse(await readFile(path, 'utf8'))
}

function print(value) {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`)
}

async function mutate(operation) {
  return withOperatorLock(privateDir, async () => {
    const state = await readOperatorState(privateDir)
    const result = await operation(state)
    await writeOperatorState(state, privateDir)
    return result
  })
}

try {
  switch (command) {
    case 'init':
      print(await mutate((state) => operatorStatus(state)))
      break
    case 'status':
      print(operatorStatus(await readOperatorState(privateDir)))
      break
    case 'customer:add': {
      const input = await inputJson()
      print(await mutate((state) => addCustomer(state, input)))
      break
    }
    case 'customer:transition': {
      const input = await inputJson()
      print(await mutate((state) => transitionCustomer(state, input)))
      break
    }
    case 'action:add': {
      const input = await inputJson()
      print(await mutate((state) => addOwnerAction(state, input)))
      break
    }
    case 'action:ack': {
      const input = await inputJson()
      print(await mutate((state) => acknowledgeOwnerAction(state, input)))
      break
    }
    case 'due': {
      const advance = args.includes('--advance')
      const result = advance
        ? await mutate((state) => dueOwnerAction(state, new Date(), true))
        : dueOwnerAction(await readOperatorState(privateDir))
      if (result) print(ownerNotification(result))
      break
    }
    case 'help':
      print(`Operator CLI

  init
  status
  customer:add --input <private-json-file>
  customer:transition --input <private-json-file>
  action:add --input <private-json-file>
  action:ack --input <private-json-file>
  due [--advance]

All state stays under campaign/private unless CAMPAIGN_PRIVATE_DIR is set.`)
      break
    default:
      throw new Error(`Unknown command: ${command}`)
  }
} catch (error) {
  process.stderr.write(`operator: ${error.message}\n`)
  process.exitCode = 1
}
