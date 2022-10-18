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

const assertThatEndpointIsSupported = (method: string) => {
  const config = useRuntimeConfig().session
  if (!config.apiMethods.includes(method)) {
    const error = `Cannot "${method}" session data as endpoint is not enabled. Configure this via the "nuxtSession.apiEnabled" and "nuxtSession.apiMethods" configuration options.`
    throw new Error(error)
  }
}

export default async (options: ComposableOptions = {
  fetchSessionOnInitialization: true
}) => {
  const config = useRuntimeConfig().session

  /**
   * The currently active session associated with the current client
   */
  const session: Ref<Session | null> = ref(null)

  const _performSessionRequest = (method: SupportedSessionApiMethods, body?: SessionData) => {
    assertThatEndpointIsSupported(method)

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

  const refresh = () => _performSessionRequest('get')

  const remove = () => {
    assertThatEndpointIsSupported('delete')
    return _performSessionRequest('delete')
  }

  const update = (payload: SessionData) => {
    assertThatEndpointIsSupported('patch')
    return _performSessionRequest('patch', payload)
  }

  const overwrite = (payload: SessionData) => {
    assertThatEndpointIsSupported('post')
    return _performSessionRequest('patch', payload)
  }

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
