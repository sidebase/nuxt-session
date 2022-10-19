<script setup lang="ts">
import { useFetch } from '#app'
import { computed, ref } from 'vue'
import { useNuxtSession } from '#imports'

const { session, refresh, reset, remove, update } = await useNuxtSession()

// Counter demo
const { refresh: increaseCountOnServer } = await useFetch('/api/count', { server: false, immediate: false })

const currentCount = computed(() => session.value?.count || null)
const increaseCountByClient = () => {
  const increasedCount = currentCount.value || 0
  return update({ count: increasedCount + 1 })
}

// Arbitrary key, value demo
const key = ref('')
const value = ref('')
</script>

<template>
  <div>
    <div>
      <h2>Current session</h2>
      <p>The full session object of the current visitor. Click the button below to refresh the session object to see if anything has changed. Something will change on session expiry (a new id + createdAt will be set) or when the count-endpoint was already requested, a new key `count` should appear.</p>
      <p>The endpoint for this request exists out of the box and is available at `GET /api/session` (the path and enabled methods are configurable via the module config `api.basePath` key)</p>
      <pre>{{ session || 'no session exists, have you deleted it? Click refresh to get a new one!' }}</pre>
      <button @click="refresh">
        Refresh session!
      </button>
    </div>
    <hr>
    <div>
      <h3>Counting</h3>
      <p>With nuxt-session you can either access the current user session safely on the server side using `event.context.session`. You can also use the `update`-method of the `useNuxtSession` composable that allows arbitrary updating of session data from the client-side.</p>
      <p>Below both possible options are show-cased. One button triggers a request to the `/api/count` endpoint that increases the request count on the server side. The second button sends a JSON-payload to the nuxt-session API endpoint that allows arbitrary updating of session data with data sent from the client side.</p>
      <p>When you increase the count on the server-side, the session here will not change. You need to hit the `refresh` button above to see the changes! When we update it from the client-side using the nuxt-session composable `update` for it, we immeadiatly see the updates reflected, neat!</p>
      <p>NOTE: The server-side and client-side count update can collide with each other, e.g., if you update the count on the server side a couple of times and then update the count from the client side without refreshing the session. As the client only has the "old" count, it will send a different count than the count that the server currently knows and thus overwrite it.</p>
      <p>NOTE: Exposing session manipulation to the client-side can be dangerous, depending on your use case. It can lead to flawed data on accident or even on purpose by an attacker. You can configure what endpoints are exposed by nuxt-session using the `api.isEnabled` config flag. You can use the `api.methods` module config array to more narrowly define which methods you want to support.</p>
      <pre>{{ currentCount || 'no count sent yet' }}</pre>
      <button @click="increaseCountOnServer">
        Increase server-side!
      </button>
      <button @click="increaseCountByClient">
        Increase client-side!
      </button>
    </div>
    <hr>
    <div>
      <h3>Arbitrary data</h3>
      <p>Update the session with arbitrary data. Everything supported by JSON is possible, here we restrict ourselves to manually typed key-value pairs provided by you.</p>
      <p>There's a variant of `update` called `overwrite`: This allows you to overwrite all existing session data with new data that you pass without re-newing the session. Note that if you just want to reset the session you can just call `reset`.</p>
      <input v-model="key" type="text" placeholder="Key">
      <input v-model="value" type="text" placeholder="Value">
      <button @click="update({ [key]: value })">
        Update!
      </button>
    </div>
    <hr>
    <div>
      <h3>Reset the session</h3>
      <p>Resetting the current session will result in a new session being assinged. The `count` should be removed, the `id` should change and the `createdAt` should update</p>
      <p>Use the `reset` method exposed by the nuxt-session module to perform this action.</p>
      <button @click="reset">
        Reset session!
      </button>
    </div>
    <hr>
    <div>
      <h3>Delete the session</h3>
      <p>Deleting the current session will result in a deletion of the current session without a new session being assinged. Note that any request that comes after the delete request will immeadiatly set a new session.</p>
      <button @click="remove">
        Delete session!
      </button>
    </div>
  </div>
</template>
