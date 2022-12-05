import { addImportsDir, addServerHandler, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { builtinDrivers } from 'unstorage'
import type {
  FilledModuleOptions,
  ModuleOptions,
  ModulePublicRuntimeConfig,
  SessionIpPinningOptions,
  SupportedSessionApiMethods
} from './types'

const PACKAGE_NAME = 'nuxt-session'

const defaults: FilledModuleOptions = {
  isEnabled: true,
  session: {
    expiryInSeconds: 60 * 10,
    idLength: 64,
    storePrefix: 'sessions',
    cookieSameSite: 'lax',
    cookieSecure: true,
    cookieHttpOnly: true,
    storageOptions: {
      driver: 'memory',
      options: {}
    },
    domain: false,
    ipPinning: false as boolean|SessionIpPinningOptions,
    rolling: false
  },
  api: {
    isEnabled: true,
    methods: [] as SupportedSessionApiMethods[],
    basePath: '/api/session'
  }
} as const

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: `@sidebase/${PACKAGE_NAME}`,
    configKey: 'session',
    compatibility: {
      bridge: false
    }
  },
  defaults,
  hooks: {},
  setup (moduleOptions, nuxt) {
    const logger = useLogger(PACKAGE_NAME)

    // 1. Check if module should be enabled at all
    if (!moduleOptions.isEnabled) {
      logger.info(`Skipping ${PACKAGE_NAME} setup, as module is disabled`)
      return
    }

    logger.info('Setting up sessions...')

    // 2. Set public and private runtime configuration
    const options = defu(moduleOptions, defaults)
    if (moduleOptions.api.methods && moduleOptions.api.methods.length > 0) {
      options.api.methods = moduleOptions.api.methods
    } else {
      options.api.methods = ['patch', 'delete', 'get', 'post']
    }

    // @ts-ignore TODO: Fix this `nuxi prepare` bug (see https://github.com/nuxt/framework/issues/8728)
    nuxt.options.runtimeConfig.session = defu(nuxt.options.runtimeConfig.session, options) as FilledModuleOptions

    const publicConfig: ModulePublicRuntimeConfig = { session: { api: options.api } }
    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, publicConfig)

    // setup unstorage
    nuxt.options.nitro.virtual = defu(nuxt.options.nitro.virtual, {
      '#session-driver': `export { default } from '${
        builtinDrivers[options.session.storageOptions.driver]
      }'`
    })

    // 3. Locate runtime directory and transpile module
    const { resolve } = createResolver(import.meta.url)

    // 4. Setup middleware, use `.unshift` to ensure (reasonably well) that the session middleware is first
    const handler = resolve('./runtime/server/middleware/session')
    const serverHandler = {
      middleware: true,
      handler
    }
    nuxt.options.serverHandlers.unshift(serverHandler)

    // 5. Register desired session API endpoints
    if (options.api.isEnabled) {
      for (const apiMethod of options.api.methods) {
        const handler = resolve(`./runtime/server/api/session.${apiMethod}`)
        addServerHandler({ handler, route: options.api.basePath })
      }
      logger.info(`Session API "${options.api.methods.join(', ')}" endpoints registered at "${options.api.basePath}"`)
    } else {
      logger.info('Session API disabled')
    }

    // 6. Add nuxt-session composables
    const composables = resolve('./runtime/composables')
    addImportsDir(composables)

    logger.success('Session setup complete')
  }
})

export * from './types'
