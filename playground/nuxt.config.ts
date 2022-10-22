import { defineNuxtConfig } from 'nuxt/config'
import NuxtSession from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtSession],
  session: {
    session: {
      // Redis
      // storageOptions: {
      //   driver: 'redis'
      // }
      // fs
      // storageOptions: {
      //   driver: 'fs',
      //   base: './tmp'
      // }
    }
  }
})
