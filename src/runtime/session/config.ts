import { useRuntimeConfig } from '#imports'

export declare interface SessionOptions {
  sessionExpiryInSeconds: number
  sessionIdLength: number
  sessionStorePrefix: string
  sessionCookieSameSite: 'lax' | 'strict' | 'none'
}

export default (): SessionOptions => useRuntimeConfig().session
