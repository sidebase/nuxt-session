import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { addServerHandler, defineNuxtModule, useLogger } from '@nuxt/kit'
import { SessionOptions } from './runtime/session/config'

export interface ModuleOptions extends SessionOptions {
  isEnabled: boolean
}

export const PACKAGE_NAME = 'nuxt-session'
export const LOGGER = useLogger(PACKAGE_NAME)

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
    sessionIdLength: 2,
    sessionStorePrefix: 'sessions',
    sessionCookieSameSite: 'lax'
  },
  hooks: {},
  setup(moduleOptions, nuxt) {
    if (!moduleOptions.isEnabled) {
      LOGGER.info(`Skipping ${PACKAGE_NAME} setup, as module is disabled`)
      return
    }

    LOGGER.info('Setting up module...')

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    // Set runtime config
    nuxt.options.runtimeConfig.session = moduleOptions

    // Setup handler
    const handler = resolve(runtimeDir, 'session')
    const serverHandler = {
      middleware: true,
      handler
    }

    // Ensure that the session middleware is registered first
    addServerHandler(serverHandler)
    // nuxt.options.serverHandlers.unshift(serverHandler)

    LOGGER.success('Module setup complete')
  }
})
