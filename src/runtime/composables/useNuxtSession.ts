import { useFetch } from '#app'
import { nanoid } from 'nanoid'
import { Ref, ref } from 'vue'
import type { SupportedSessionApiMethods } from '../../module'
import type { Session } from '../server/middleware/session'
import { useRuntimeConfig } from '#imports'

type SessionData = Record<string, any>

declare interface ComposableOptions {
  fetchSessionOnInitialization: boolean
}

export default async (options: ComposableOptions = {
  fetchSessionOnInitialization: true
}) => {
  /**
   * The currently active session associated with the current client
   */
  const session: Ref<Session | null> = ref(null)

  const _performSessionRequest = (method: SupportedSessionApiMethods, body?: SessionData) => {
    const config = useRuntimeConfig().session
    if (!config.apiMethods.includes(method)) {
      const error = `Cannot "${method}" session data as endpoint is not enabled. Configure this via the "nuxtSession.apiEnabled" and "nuxtSession.apiMethods" configuration options.`
      throw new Error(error)
    }

    // Return the fetch so that it is executed in the component context + to allow further introspection by the user if desired
    return useFetch(config.apiBasePath, {
      // Method must be capitalized for HTTP-request to work
      method: method.toUpperCase(),
      body,

      // Do not fetch on server, as the cookie is stored and sent by the client
      server: false,

      // Never cache
      key: nanoid(),

      // Overwrite the `session`-ref if desired
      onResponse ({ response }) {
        const data = response._data

        session.value = data
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
    await refresh()
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
