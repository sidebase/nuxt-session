import { useFetch, createError, useRequestHeaders, useNuxtApp, useRuntimeConfig } from '#app'
import { nanoid } from 'nanoid'
import { Ref, ref } from 'vue'
import type { Session, SupportedSessionApiMethods } from '../../types'

type SessionData = Record<string, any>

// Key for the session value in the nuxt payload
const SESSION_VALUE_KEY = 'nuxt-session:session-value'

declare interface ComposableOptions {
  fetchSessionOnInitialization: boolean
}

export default async (options: ComposableOptions = {
  fetchSessionOnInitialization: true
}) => {
  /**
   * The currently active session associated with the current client
   * @type Ref<Session | null>
   */
  const session: Ref<Session | null> = ref(null)

  const _performSessionRequest = (method: SupportedSessionApiMethods, body?: SessionData) => {
    const config = useRuntimeConfig().public.session
    if (!config.api.isEnabled || !config.api.methods.includes(method)) {
      const message = `Cannot "${method}" session data as endpoint is not enabled. If you want to be able to "${method}" session data, you can configure this via the "session.api.isEnabled: boolean" and "session.api.methods: ('post' | 'get' | ...)[]" module configuration options.`
      throw createError({ message, statusCode: 500 })
    }

    const nuxt = useNuxtApp()

    // Return the fetch so that it is executed in the component context + to allow further introspection by the user if desired
    return useFetch(config.api.basePath, {
      // Pass the cookie from the current request to the session-api
      headers: {
        cookie: useRequestHeaders(['cookie']).cookie ?? ''
      },

      // Method must be capitalized for HTTP-request to work
      method: method.toUpperCase(),
      body,

      // Never cache
      key: nanoid(),

      // Overwrite the `session`-ref before returning the value for the end-callee
      onResponse ({ response }) {
        const data = response._data

        session.value = data

        // If we are on the server, store session value in nuxt payload to avoid hydration issues
        if (process.server) {
          nuxt.payload.state[SESSION_VALUE_KEY] = data
        }

        return data
      }
    })
  }

  /**
   * Refresh the current session. Overwrites the current, local session with the most-recent server-side session state.
   */
  const refresh = () => _performSessionRequest('get')

  /**
   * Delete the current session. Calls an endpoint that deletes the current session without assigning a new one.
   */
  const remove = () => _performSessionRequest('delete')

  /**
   * Update the current session with new data. Adds the passed data into the current session using a spread on the server side. No data will be overwritten or lost unless
   * a key is passed that already exists in the current session.
   */
  const update = (payload: SessionData) => _performSessionRequest('patch', payload)

  /**
   * Overwrite the current session with new data. The session stays the same, but instead of merging in the passed data, the current data is replaced with the new data.
   */
  const overwrite = (payload: SessionData) => _performSessionRequest('post', payload)
  const reset = async () => {
    await remove()
    return refresh()
  }

  // Initialize session object
  if (options.fetchSessionOnInitialization) {
    const nuxt = useNuxtApp()

    if (nuxt.isHydrating) {
      session.value = nuxt.payload.state[SESSION_VALUE_KEY]
    } else {
      await refresh()
    }
  }

  return {
    session,
    reset,
    overwrite,
    update,
    remove,
    refresh
  }
}
