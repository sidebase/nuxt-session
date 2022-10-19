import { eventHandler } from 'h3'

export default eventHandler(event => event.context.session)
