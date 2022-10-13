<script setup lang="ts">
import { useFetch } from '#app';
import { ref } from 'vue';

// Note: `server: false` as the initial server-side request would not have any cookies attached, so the session could not be restored there. With `server: false`
// nuxt 3 triggers the request on the client side, so that the cookies will be there, see https://v3.nuxtjs.org/api/composables/use-fetch#params
const { data: count, refresh: refreshCount } = await useFetch('/api/count', { server: false })
const { data: session, refresh: refreshSession } = await useFetch('/api/session', { server: false })

const { data: deleteResponse, refresh: deleteSession } = await useFetch('/api/session', { method: 'DELETE' })
</script>

<template>
  <div>
    <div>
      <h2>Current session</h2>
      <p>The full session object of the current visitor. Click the button below to refresh the session object to see if anything has changed. Something will change on session expiry (a new id + createdAt will be set) or when the count-endpoint was already requested, a new key `count` should appear.</p>
      <pre>{{ session }}</pre>
      <button @click="refreshSession">
        Refresh session!
      </button>
    </div>
    <hr/>
    <div>
      <h2>Current count</h2>
      <p>The amount of times the `/api/count` endpoint was hit by the current visitor. Click the button to trigger a new request to the count-endpoint and increase the count by 1. Clicking this button will not trigger a full refetch of the session-object above. Feel free to increase the count a couple of times and then refresh the session above afterwards to see that the count is stored as part of the same object (:</p>
      <pre>{{ count }}</pre>
      <button @click="refreshCount">
        Increase count!
      </button>
    </div>
    <hr/>
    <div>
      <h3>Reset the session</h3>
      <p>Deleting the current session will result in a new session being assinged. The `count` should be reset, the `id` should change and the `createdAt` should update</p>
      <pre>{{ deleteResponse || 'Delete not triggered yet' }}</pre>
      <button @click="deleteSession">
        Delete session!
      </button>
    </div>
  </div>
</template>
