#!/usr/bin/env node
import {
  businessStatus,
  businessManagerGate,
  dueBusinessAction,
  initializeBusinesses,
  readBusinessRegistry,
} from './business-core.mjs'

const [command = 'help', ...args] = process.argv.slice(2)

function argument(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function print(value) {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`)
}

try {
  switch (command) {
    case 'list': {
      const registry = await readBusinessRegistry()
      print(registry.businesses.map((business) => ({
        slug: business.slug,
        name: business.name,
        category: business.category,
        validationGate: business.validationGate,
      })))
      break
    }
    case 'init': {
      print(await initializeBusinesses({ slug: argument('--slug') }))
      break
    }
    case 'status': {
      print(await businessStatus({ slug: argument('--slug') }))
      break
    }
    case 'gate': {
      const slug = argument('--slug')
      if (!slug) throw new Error('--slug <business> is required')
      print(await businessManagerGate({ slug }))
      break
    }
    case 'due': {
      const message = await dueBusinessAction({ advance: args.includes('--advance') })
      if (message) print(message)
      break
    }
    case 'help':
      print(`Business CLI

  list
  init [--slug <business>]
  status
  gate --slug <business>
  due [--advance]

Each business gets isolated private state under campaign/private/businesses/<slug>.`)
      break
    default:
      throw new Error(`Unknown command: ${command}`)
  }
} catch (error) {
  process.stderr.write(`business: ${error.message}\n`)
  process.exitCode = 1
}
