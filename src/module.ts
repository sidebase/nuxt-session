import { addImportsDir, addServerHandler, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { BuiltinDriverName, builtinDrivers } from 'unstorage'

export type SameSiteOptions = 'lax' | 'strict' | 'none'
export type SupportedSessionApiMethods = 'patch' | 'delete' | 'get' | 'post'

interface StorageOptions {
  driver: BuiltinDriverName,
  options: object
}

declare interface SessionOptions {
/**
   * Set the session duration in seconds. Once the session expires, a new one with a new id will be created. Set to `null` for infinite sessions
   * @default 600
   * @example 30
   * @type number | null
   */
  expiryInSeconds: number | null
   /**
    * How many characters the random session id should be long
    * @default 64
    * @example 128
    * @type number
    */
  idLength: number
   /**
    * What prefix to use to store session information via `unstorage`
    * @default "sessions"
    * @example "userSessions"
    * @type number
    * @docs https://github.com/unjs/unstorage
    */
   storePrefix: string
   /**
    * When to attach session cookie to requests
    * @default 'lax'
    * @example 'strict'
    * @type SameSiteOptions
    * @docs https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
    */
   cookieSameSite: SameSiteOptions
   /**
    * Driver configuration for session-storage. Per default in-memory storage is used
    * @default { driver: 'memory', options: {} }
    * @example { driver: 'redis', options: {url: 'localhost:6379'} }
    * @docs https://nitro.unjs.io/guide/introduction/storage
    */
   storageOptions: StorageOptions,
}

declare interface ApiOptions {
  /**
   * Whether to enable the session API endpoints that allow read, update and delete operations from the client side. Use `/api/session` to access the endpoints.
   * @default true
   * @example false
   * @type boolean
   */
   isEnabled: boolean
   /**
    * Configure which session API methods are enabled. All api methods are enabled by default. Restricting the enabled methods can be useful if you want to allow the client to read session-data but not modify it. Passing
    * an empty array will result in all API methods being registered. Disable the api via the `api.isEnabled` option.
    * @default []
    * @example ['get']
    * @type SupportedSessionApiMethods[]
    */
   methods: SupportedSessionApiMethods[]
   /**
    * Base path of the session api.
    * @default /api/session
    * @example /_session
    * @type string
    */
   basePath: string
}

export interface ModuleOptions {
  /**
   * Whether to enable the module
   * @default true
   * @example true
   * @type boolean
   */
  isEnabled: boolean,
  /**
   * Configure session-behvaior
   * @type SessionOptions
   */
  session: Partial<SessionOptions>
  /**
   * Configure session-api and composable-behavior
   * @type ApiOptions
   */
  api: Partial<ApiOptions>
}

const PACKAGE_NAME = 'nuxt-session'

const defaults: ModuleOptions = {
  isEnabled: true,
  session: {
    expiryInSeconds: 60 * 10,
    idLength: 64,
    storePrefix: 'sessions',
    cookieSameSite: 'lax',
    storageOptions: {
      driver: 'memory',
      options: {}
    }
  },
  api: {
    isEnabled: true,
    methods: [],
    basePath: '/api/session'
  }
}

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
    options.api.methods = moduleOptions.api.methods.length > 0 ? moduleOptions.api.methods : ['patch', 'delete', 'get', 'post']
    nuxt.options.runtimeConfig.session = defu(nuxt.options.runtimeConfig.session, options)
    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, { session: { api: options.api } })
    // setup unstorage
    nuxt.options.nitro.virtual = defu(nuxt.options.nitro.virtual,
      {
        '#session-driver': `export { default } from '${builtinDrivers[options.session.storageOptions.driver]}'`
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

declare module '#session-driver'{
  const driver : BuiltinDriverName
  export default driver
}
