// This middleware should already be able to access the sesssion, as the module session middleware should run BEFORE all other middlewares
console.log('registering 2')

export default eventHandler((event) => {
  console.log('this is the current session: ', event.context.session)
})
