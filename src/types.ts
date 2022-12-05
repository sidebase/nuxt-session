import type { BuiltinDriverName } from 'unstorage'
import type { FSStorageOptions } from 'unstorage/dist/drivers/fs'
import type { KVOptions } from 'unstorage/dist/drivers/cloudflare-kv-binding'
import type { KVHTTPOptions } from 'unstorage/dist/drivers/cloudflare-kv-http'
import type { GithubOptions } from 'unstorage/dist/drivers/github'
import type { HTTPOptions } from 'unstorage/dist/drivers/http'
import type { OverlayStorageOptions } from 'unstorage/dist/drivers/overlay'
import type { LocalStorageOptions } from 'unstorage/dist/drivers/localstorage'
import type { RedisOptions } from 'unstorage/dist/drivers/redis'

export type SameSiteOptions = 'lax' | 'strict' | 'none'
export type SupportedSessionApiMethods = 'patch' | 'delete' | 'get' | 'post'

export type UnstorageDriverOption = FSStorageOptions | KVOptions | KVHTTPOptions | GithubOptions | HTTPOptions | OverlayStorageOptions | LocalStorageOptions | RedisOptions

export interface StorageOptions {
  driver: BuiltinDriverName,
  options?: UnstorageDriverOption
}
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
   * Set the session duration in seconds. Once the session expires, a new one with a new id will be created. Set to `false` for infinite sessions
   * @default 600
   * @example 30
   * @type number | false
   */
  expiryInSeconds: number | false
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
   * Wether to set the `Secure` attribute for the session cookie
   * @default true
   * @example false
   * @type boolean
   * @docs https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
   */
  cookieSecure: boolean
  /**
   * Wether to set the `HttpOnly` attribute for the session cookie. When `HttpOnly` is set the session cookie will not be accessible from JavaScript, this can mitigate XSS attacks
   * @default true
   * @example false
   * @type boolean
   * @docs https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
   */
   cookieHttpOnly: boolean
  /**
   * Driver configuration for session-storage. Per default in-memory storage is used
   * @default { driver: 'memory', options: {} }
   * @example { driver: 'redis', options: {url: 'redis://localhost:6739' } }
   * @docs https://github.com/unjs/unstorage
   */
  storageOptions: StorageOptions,
  /**
   * Set the domain the session cookie will be receivable by. Setting `domain: false` results in setting the domain the cookie is initially set on. Specifying a domain will allow the domain and all its sub-domains.
   * @default false
   * @example '.example.com'
   * @type string | false
   * @docs https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_where_cookies_are_sent
   */
  domain: string | false,
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
  /**
   * Force the session identifier cookie to be set on every response. The expiration is reset to the original expiryInSeconds, resetting the expiration countdown.
   * @default false
   * @example true
   * @type boolean
   */
  rolling: boolean,
  /**
   * Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
   * Choosing false is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie.
   * @default true
   * @example false
   * @type boolean
   */
  saveUninitialized: boolean,
  /**
    * Forces the session to be saved back to the session store, even if the session was never modified during the request.
    * @default true
    * @example false
    * @type boolean
    */
  resave: boolean
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
