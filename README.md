![nuxt session logo](./.github/session.png)

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
- ✔️ Storage via [unjs/unstorage](https://github.com/unjs/unstorage) - use memory, redis, fs, cloudflare-kv, ... to store your session data
- ✔️ Configurable session duration
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
3. Each request will now have a session at `event.context.session` that looks like:
    ```ts
    {
      id: 'TLyEy2Mav2G_sawgek7fqqj6EaWrO9LDAfLjhjHRKbE6M-_nGhT1iK7sTwqZ-xoT',
      createdAt: '2022-10-12T09:12:38.406Z'
    }
    ```

All modifications of ``event.context.session` will automatically be stored. [Here's an endpoint that persists a counter per user](playground/server/api/count.get.ts):
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

To use the session on the client side (i.e., in your client app) you could create an endpoint that returns the session (or a part of it):
```ts
// File: `server/api/me.get.ts`
export default defineEventHandler((event: CompatibilityEvent) => event.context.session)
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
- Use `npm run dev` to start [playground](./playground) in development mode.
- Run `npm run lint` to run eslint
- Run `npm run type` to run typescheck via tsc



<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@sidebase/nuxt-session/latest.svg
[npm-version-href]: https://npmjs.com/package/@sidebase/nuxt-session

[npm-downloads-src]: https://img.shields.io/npm/dt/@sidebase/nuxt-session.svg
[npm-downloads-href]: https://npmjs.com/package/@sidebase/nuxt-session

[license-src]: https://img.shields.io/npm/l/@sidebase/nuxt-session.svg
[license-href]: https://npmjs.com/package/@sidebase/nuxt-session
