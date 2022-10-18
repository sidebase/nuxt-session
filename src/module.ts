import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { addServerHandler, defineNuxtModule, useLogger } from '@nuxt/kit'
import { CreateStorageOptions } from 'unstorage'

export type SameSiteOptions = 'lax' | 'strict' | 'none'
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
   sessionStorageOptions: CreateStorageOptions
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
    sessionStorageOptions: {}
  },
  hooks: {},
  setup (moduleOptions, nuxt) {
    const logger = useLogger(PACKAGE_NAME)

    if (!moduleOptions.isEnabled) {
      logger.info(`Skipping ${PACKAGE_NAME} setup, as module is disabled`)
      return
    }

    logger.info('Setting up module...')

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    // Set runtime config
    nuxt.options.runtimeConfig.session = moduleOptions

    // Setup handler
    const handler = resolve(runtimeDir, 'server/middleware/session')
    const serverHandler = {
      middleware: true,
      handler
    }

    // Ensure that the session middleware is registered first
    addServerHandler(serverHandler)
    // nuxt.options.serverHandlers.unshift(serverHandler)

    logger.success('Module setup complete')
  }
})
