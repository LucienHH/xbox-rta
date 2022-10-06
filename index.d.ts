/// <reference types="node" />
import { EventEmitter } from 'events';
import XboxRTA from '.src/index';
import RTAClient from './src/client';
declare module 'xbox-rta' {
  export class XboxRTA extends RTAClient {
    /**
     * Creates a new xbox-rta instance, which handles and creates a socket connection the the Xbox RTA (Real Time Activity) service
     * @param authflow An Authflow instance from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth).
     * @param options Options for the XboxRTA instance
     */
    constructor(authflow: Authflow, options = {})

    /**
     * Connects to the Xbox RTA service
     */
    connect(): Promise<void>

    /**
     * Disconnects from the Xbox RTA service
     */
    disconnect(): Promise<void>

    /**
     * Subscribes to a specific RTA event
     * @param uri The URI to subscribe to
     */
    subscribe(uri: string): Promise<Subscription>

    /**
     * Unsubscribes from a specific RTA event
     * @param subId The id of the subscription to unsubscribe from
     */
    unsubscribe(subId: string): Promise<unsubscribeResponse>
  }

  export class Subscription {
    /**
     * Creates a new subscription instance
     * @param rta The XboxRTA instance
     * @param rawSub The raw subscription response
     */
    constructor(rta: XboxRTA, rawSub: subscribeResponse)

    /**
     * Returns an event emitter for the subscription
     */
    createEventListener(options: { timeout: number }): EventEmitter

    /**
     * Unsubscribes from the subscription
     */
    unsubscribe(): Promise<unsubscribeResponse>
  }

    export interface subscribeResponse {
      type: number
      sequence: number
      code: number
      subId: string
      data: any
    }

    export interface unsubscribeResponse {
      type: number
      sequence: number
      code: number
    }
}
