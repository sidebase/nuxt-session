import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { addServerHandler, defineNuxtModule, useLogger } from '@nuxt/kit'
import { CreateStorageOptions } from 'unstorage'

type SameSiteOptions = 'lax' | 'strict' | 'none'
type SupportedSessionApiMethods = 'patch' | 'delete' | 'get' | 'post'
export interface ModuleOptions {
  /**
   * Whether to enable the module
   * @default true
   * @example true
   * @type boolean
   */
  isEnabled: boolean,
  /**
   * Set the session duration in seconds. Once the session expires, a new one with a new id will be created. Set to `null` for infinite sessions
   * @default 600
   * @example 30
   * @type number | null
   */
  sessionExpiryInSeconds: number | null
  /**
   * How many characters the random session id should be long
   * @default 64
   * @example 128
   * @type number
   */
  sessionIdLength: number
  /**
   * What prefix to use to store session information via `unstorage`
   * @default 64
   * @example 128
   * @type number
   * @docs https://github.com/unjs/unstorage
   */
  sessionStorePrefix: string
  /**
   * When to attach session cookie to requests
   * @default 'lax'
   * @example 'strict'
   * @type SameSiteOptions
   * @docs https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
   */
  sessionCookieSameSite: SameSiteOptions
  /**
   * Driver configuration for session-storage. Per default in-memory storage is used
   * @default {}
   * @example { driver: redisDriver({ base:  'storage:' }) }
   * @type CreateStorageOptions
   * @docs https://github.com/unjs/unstorage
   */
  sessionStorageOptions: CreateStorageOptions,
  /**
   * Whether to enable the session API endpoints that allow read, update and delete operations from the client side. Use `/api/session` to access the endpoints.
   * @default true
   * @example false
   * @type boolean
   */
  apiEnabled: boolean
  /**
   * Configure which session API methods are enabled. All api methods are enabled by default. Restricting the enabled methods can be useful if you want to allow the client to read session-data but not modify it. Passing
   * an empty array will result in all API methods being registered. Disable the api via the `apiEnabled` option.
   * @default []
   * @example ['get']
   * @type SupportedSessionApiMethods[]
   */
  apiMethods: SupportedSessionApiMethods[]
  /**
   * Base path of the session api.
   * @default /api/session
   * @example /_session
   * @type string
   */
  apiBasePath: string
}

const PACKAGE_NAME = 'nuxt-session'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: `@sidebase/${PACKAGE_NAME}`,
    configKey: 'nuxtSession',
    compatibility: {
      bridge: false
    }
  },
  defaults: {
    isEnabled: true,
    sessionExpiryInSeconds: 60 * 10,
    sessionIdLength: 64,
    sessionStorePrefix: 'sessions',
    sessionCookieSameSite: 'lax',
    sessionStorageOptions: {},
    apiEnabled: true,
    apiMethods: [],
    apiBasePath: '/api/session'
  },
  hooks: {},
  setup (moduleOptions, nuxt) {
    const logger = useLogger(PACKAGE_NAME)

    // 1. Check if module should be enabled at all
    if (!moduleOptions.isEnabled) {
      logger.info(`Skipping ${PACKAGE_NAME} setup, as module is disabled`)
      return
    }

    logger.info('Setting up sessions...')

    // 2. Set runtime config, get runtime directory
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.runtimeConfig.session = moduleOptions

    // 3. Setup middleware, use `.unshift` to ensure (reasonably well) that the session middleware is first
    const handler = resolve(runtimeDir, 'server/middleware/session')
    const serverHandler = {
      middleware: true,
      handler
    }
    nuxt.options.serverHandlers.unshift(serverHandler)

    // 4. Register desired session API endpoints
    if (moduleOptions.apiEnabled) {
      const apiMethods = moduleOptions.apiMethods.length > 0 ? moduleOptions.apiMethods : ['patch', 'delete', 'get', 'post']
      for (const apiMethod of apiMethods) {
        const handler = resolve(runtimeDir, `server/api/session.${apiMethod}.ts`)
        addServerHandler({ handler, route: moduleOptions.apiBasePath })
      }
      logger.info(`Session API "${apiMethods.join(', ')}" endpoints registered at "${moduleOptions.apiBasePath}"`)
    } else {
      logger.info('Session API disabled')
    }

    logger.success('Session setup complete')
  }
})
