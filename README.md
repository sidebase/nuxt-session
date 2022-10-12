# nuxt-session

Nuxt module that adds a managed session to your application.

## Features

- ✔️ Persistent sessions
- ✔️ Configurable session duration, default: 10 minutes
- ✔️ Cookie-based storage

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

Done! You can now access the session in your backend at `event.context.session`! All modifications to it will automatically be stored. Here's an endpoint that persists a counter per user:
```ts
// File: `server/api/count.get.ts`
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
``

## Development

- Run `npm run dev:prepare` to generate type stubs.
- Use `npm run dev` to start [playground](./playground) in development mode.
- Run `npm run lint` to run eslint
- Run `npm run lint` to run typescheck via tsc
