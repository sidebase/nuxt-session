![logo of nuxt session](./.github/session.png)

# nuxt-session

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![GitHub stars](https://badgen.net/github/stars/sidebase/nuxt-session)](https://GitHub.com/sidebase/nuxt-session/)
[![License][license-src]][license-href]
[![Follow us on Twitter](https://badgen.net/badge/icon/twitter?icon=twitter&label)](https://twitter.com/sidebase_io)
[![Join our Discord](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.gg/9MUHR8WT9B)

Nuxt session middleware to persist data across multiple requests, supports many backends via unjs/unstorage: memory, redis, fs, ... 

## Features

- ✔️ Persistent sessions across requests
- ✔️ Configurable session endpoints out of the box:
    - `GET /api/session`: Get the current session
    - `DELETE /api/session`: Delete the current session
    - `POST /api/session`: Overwrite the current session data 
    - `PATCH /api/session`: Add to the current session data
- ✔️ Storage via [unjs/unstorage](https://github.com/unjs/unstorage) - use memory, redis, fs, cloudflare-kv, ... to store your session data
- ✔️ Automatic session storage cleanup on expiry
- ✔️ Transport method: Cookies 

Use the module-playground (see playground below) to play around with the module.

## Usage

1. Install the package:
    ```bash
    npm i @sidebase/nuxt-session
    ```
2. Add the package to your `nuxt.config.ts`:
    ```bash
    export default defineNuxtConfig({
      modules: ['@sidebase/nuxt-session'],
    })
    ```
3. Done! Each request will now have a session at `event.context.session`. Fetch it on the client side like:
    - from any `.vue` file:
        ```ts
        const { data: session } = await useFetch('/api/session', { server: false })

        // -> session.value contains the following after fetch:
        // {
        //  "id": "2W7WuCbAX0b4W_53ZeiFJ_3AW6lFzMF6eD_h_Y3s5l0oLNgvaIcBCWS2Mosfw-HE",
        //  "createdAt": "2022-10-18T12:44:46.786Z"
        // }
        ```
    - from the terminal:
        ```sh
        > curl localhost:3000/api/session -v

        ...
        # The cookie being set!
        < set-cookie: sessionId=ijdGtxlo9BaXmeFZ9PqcbeGDKhr5R_VefJJYPDRK_Qn-ZECdJ1D1mF-NvRQ2KuWf; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax
        ...

        # The session object with id and creation time:
        {
          "id": "2W7WuCbAX0b4W_53ZeiFJ_3AW6lFzMF6eD_h_Y3s5l0oLNgvaIcBCWS2Mosfw-HE",
          "createdAt": "2022-10-18T12:44:46.786Z"
        }
        ```

All modifications of `event.context.session` will automatically be stored. [Here's an endpoint that persists a counter per user](https://github.com/sidebase/nuxt-session/playground/server/api/count.get.ts):
```ts
// File: `playground/server/api/count.get.ts`
export default defineEventHandler(async (event: CompatibilityEvent) => {
  // Get the current count or set to 0 if this is the first request
  const currentCount = event.context.session.count || 0

  // Increase the count
  event.context.session.count = currentCount + 1

  // Return the count
  return event.context.session.count
})
```

To use the session on the client side (i.e., in your client app) you can use the endpoints that are provided by this module out of the box!
```

## Playground

An example page making use of `nuxt-session`:
![nuxt session counter example](./.github/session-example.png)

See the playground to interactively use this:
```sh
> git clone https://github.com/sidebase/nuxt-session

> cd nuxt-session

> npm i

> npm run dev:prepare

> npm run dev

# -> open http://localhost:3000
```

## Development

- Run `npm run dev:prepare` to generate type stubs.
- Use `npm run dev` to start [the module playground](./playground) in development mode.
- Run `npm run lint` to run eslint
- Run `npm run type` to run typescheck via tsc



<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@sidebase/nuxt-session/latest.svg
[npm-version-href]: https://npmjs.com/package/@sidebase/nuxt-session

[npm-downloads-src]: https://img.shields.io/npm/dt/@sidebase/nuxt-session.svg
[npm-downloads-href]: https://npmjs.com/package/@sidebase/nuxt-session

[license-src]: https://img.shields.io/npm/l/@sidebase/nuxt-session.svg
[license-href]: https://npmjs.com/package/@sidebase/nuxt-session
