export default defineEventHandler((event) => {
  event.context.session = {}

  return `session deleted at ${new Date()}`
})
