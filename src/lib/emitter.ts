import { EventEmitter } from 'events'

// Singleton in-memory emitter per restaurantId
const emitters = new Map<string, EventEmitter>()

export function getEmitter(restaurantId: string): EventEmitter {
  if (!emitters.has(restaurantId)) {
    const ee = new EventEmitter()
    ee.setMaxListeners(100)
    emitters.set(restaurantId, ee)
  }
  return emitters.get(restaurantId)!
}

export function emitUpdate(restaurantId: string) {
  getEmitter(restaurantId).emit('update')
}
