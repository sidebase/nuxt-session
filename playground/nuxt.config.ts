import { defineNuxtConfig } from 'nuxt/config'
import NuxtSession from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtSession],
  session: {
    session: {
      // redis example configuration
      // storageOptions: {
      //   driver: 'redis',
      //   options: {
      //     url: 'redis://localhost:6379'
      //   }
      // }
    }
  }
})
