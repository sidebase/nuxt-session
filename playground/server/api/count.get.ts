export default defineEventHandler((event) => {
  // Get the current count or set to 0 if this is the first request
  const currentCount = event.context.session.count || 0

  // Increase the count (nuxt-session will persist all changes made to `event.context.session` after the return)
  event.context.session.count = currentCount + 1

  // Return the count
  return event.context.session.count
})
