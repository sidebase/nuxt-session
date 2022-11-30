import NuxtSession from '../src/module'

export default defineNuxtConfig({
  // @ts-expect-error See https://github.com/nuxt/framework/issues/8931
  modules: [NuxtSession]
})
