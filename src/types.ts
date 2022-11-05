import type { CreateStorageOptions } from 'unstorage'

export type SameSiteOptions = 'lax' | 'strict' | 'none'
export type SupportedSessionApiMethods = 'patch' | 'delete' | 'get' | 'post'

export interface SessionIpPinningOptions {
  /**
   * The name of the HTTP header used to retrieve the forwarded (real) IP address of the user
   * @example 'X-Forwarded-For'
   * @type string
   */
  headerName: string;
}

export interface SessionOptions {
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
   * @default 64
   * @example 128
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
   * @default {}
   * @example { driver: redisDriver({ base:  'storage:' }) }
   * @type CreateStorageOptions
   * @docs https://github.com/unjs/unstorage
   */
  storageOptions: CreateStorageOptions,
  /**
   * Whether to pin sessions to the user's IP (i.e. Different IP means a different session)
   * @default false
   * @example
   *   {
   *     headerName: "X-Forwarded-For"
   *   }
   * @type {SessionIpPinningOptions|boolean}
   */
  ipPinning: SessionIpPinningOptions|boolean,
}

export interface ApiOptions {
  /**
   * Whether to enable the session API endpoints that allow read, update and delete operations from the client side. Use `/api/session` to access the endpoints.
   * @default true
   * @example false
   * @type boolean
   */
  isEnabled: boolean;
  /**
   * Configure which session API methods are enabled. All api methods are enabled by default. Restricting the enabled methods can be useful if you want to allow the client to read session-data but not modify it. Passing
   * an empty array will result in all API methods being registered. Disable the api via the `api.isEnabled` option.
   * @default []
   * @example ['get']
   * @type SupportedSessionApiMethods[]
   */
  methods: SupportedSessionApiMethods[];
  /**
   * Base path of the session api.
   * @default /api/session
   * @example /_session
   * @type string
   */
  basePath: string;
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
   * Configure session-behavior
   * @type SessionOptions
   */
  session: Partial<SessionOptions>
  /**
   * Configure session-api and composable-behavior
   * @type ApiOptions
   */
  api: Partial<ApiOptions>
}

export interface FilledModuleOptions {
  /**
   * Whether the module is enabled
   * @type boolean
   */
  isEnabled: boolean,

  /**
   * Session configuration
   * @type SessionOptions
   */
  session: SessionOptions,

  /**
   * Session-api and composable-behavior configuration
   * @type ApiOptions
   */
  api: ApiOptions
}

export interface ModuleRuntimeConfig {
  session: FilledModuleOptions;
}

export interface ModulePublicRuntimeConfig {
  session: {
    api: ModuleRuntimeConfig['session']['api'];
  };
}

export declare interface Session {
  id: string;
  createdAt: Date;
  ip?: string;

  [key: string]: any;
}
