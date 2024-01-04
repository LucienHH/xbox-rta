import debugFn from 'debug'
import { WebSocket, type Data } from 'ws'
import { Authflow } from 'prismarine-auth'
import { TypedEmitter } from 'tiny-typed-emitter'

import { MessageType, StatusCode, convertRTAStatus } from './common/constants'

const debug = debugFn('xbox-rta')

const address = 'wss://rta.xboxlive.com/connect'

export interface SubscribeResponse {
  type: number
  sequenceId: number
  status: number
  subscriptionId: string
  data: unknown
  uri: string | null
}

export interface UnsubscribeResponse {
  type: number
  sequenceId: number
  status: number
}

export interface EventResponse {
  type: number
  subscriptionId: string
  data: unknown
}

interface RTAEvents {
  event: (event: EventResponse) => void
  subscribe: (event: SubscribeResponse) => void
  unsubscribe: (event: UnsubscribeResponse) => void
  error: (error: Error) => void
}

const promiseMap = new Map<number, { resolve: (value: unknown) => void, reject: (reason?: any) => void, data: string }>()

export class XboxRTA extends TypedEmitter<RTAEvents> {

  public subscriptions: Map<number, SubscribeResponse> = new Map()

  private ws: WebSocket | null = null

  private queue: string[]

  private authflow: Authflow

  private authorization: string | null = null

  private heartbeatTimeout: NodeJS.Timeout | null = null

  private reconnectTimeout: NodeJS.Timeout | null = null

  private sequenceId: number = 0

  constructor(authflow: Authflow) {
    super()

    this.authflow = authflow

    this.queue = []
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) throw new Error(`Already connected to ${address}`)
    await this.init()
  }

  async destroy(resume = false) {

    debug('Disconnecting from RTA')

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {

      this.ws.removeListener('pong', () => { this.heartbeat() })

      this.ws.onmessage = null
      this.ws.onclose = null

      const shouldClose = this.ws.readyState === WebSocket.OPEN

      if (shouldClose) {
        let outerResolve: () => void

        const promise = new Promise<void>((resolve) => {
          outerResolve = resolve
        })

        this.ws.onclose = outerResolve!

        this.ws.close(1000, 'Normal Closure')

        await promise
      }

      this.ws.onerror = null
    }

    if (resume) {
      return this.init()
    }


  }

  async subscribe(uri: string) {
    debug('Subscribing', uri)

    const sequenceId = this.sequenceId++

    return this.send(MessageType.Subscribe, sequenceId, uri) as Promise<SubscribeResponse>
  }

  async unsubscribe(subscriptionId: string) {
    debug('Unsubscribing', subscriptionId)

    const sequenceId = this.sequenceId++

    return this.send(MessageType.Unsubscribe, sequenceId, subscriptionId) as Promise<UnsubscribeResponse>
  }

  private async send(type: MessageType, sequenceId: number, payload: string) {
    let data = ''

    switch (type) {
      case MessageType.Subscribe: data = `[${type},${sequenceId},"${payload}"]`; break
      case MessageType.Unsubscribe: data = `[${type},${sequenceId},${payload}]`; break
      default: data = `[${type},${sequenceId},${payload}]`; break
    }

    debug('Sending', data)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
    else {
      this.queue.push(data)
    }

    const response = new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 30000)
      promiseMap.set(sequenceId, { resolve, reject, data: payload })
    })

    return response
  }

  // async getNonce() {
  // 	debug('Fetching RTA nonce');
  // 	const nonce = await axios('https://rta.xboxlive.com/nonce', { headers: { authorization: this.authorization } }).then(res => res.data.nonce);
  // 	debug('Fetched RTA nonce', nonce);
  // 	return nonce;
  // }

  private async init() {

    const xbl = await this.authflow.getXboxToken('http://xboxlive.com')

    this.authorization = `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`

    // const nonce = await this.getNonce()

    debug(`Connecting to ${address}`)

    const ws = new WebSocket(`${address}`, { headers: { 'authorization': this.authorization, 'Accept-Language': 'en-GB' } })

    ws.on('pong', () => { this.heartbeat() })

    ws.onopen = () => {
      this.onOpen()
    }

    ws.onclose = (event) => {
      this.onClose(event.code, event.reason)
    }

    ws.onerror = (event) => {
      this.onError(event.error)
    }

    ws.onmessage = (event) => {
      this.onMessage(event.data)
    }

    this.ws = ws
  }

  private onOpen() {
    debug('RTA Connected to', address)

    this.reconnectTimeout = setTimeout(() => {
      debug(`Reconnecting to ${address}`)

      this.destroy(true)
    }, 90 * 60 * 1000) // 90 minutes

    this.queue.forEach(message => this.ws!.send(message))

    this.queue = []

    this.subscriptions.forEach((sub) => {
      if (sub.uri) {
        void this.send(sub.type, sub.sequenceId, sub.uri)
          .catch((err) => { debug('Resubscribe failed', err) })
      }
    })

  }

  private onError(err: Error) {
    debug('RTA Error', err)
  }

  private onClose(code: number, reason: string) {
    debug(`RTA Disconnected from ${address} with code ${code} and reason ${reason}`)

    if (code === 1006) {
      debug('RTA Connection Closed Unexpectedly')

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
      }

      this.destroy(true)
    }
  }

  private onMessage(res: Data) {

    if (!(typeof res === 'string')) return debug('Recieved non-string message', res)

    const msgJson = JSON.parse(res)

    const messageType = msgJson[0]

    debug('Recieved message', res)

    switch (messageType) {
      case MessageType.Subscribe: {
        const [type, sequenceId, status, subscriptionId, data] = msgJson

        const promise = promiseMap.get(sequenceId)

        if (status !== StatusCode.Success) {
          debug('Subscribe failed', status)
          promise?.reject(new Error(`Subscribe failed with status code ${status} ${convertRTAStatus(status)}`))
          this.emit('error', new Error(`Subscribe failed with status code ${status} ${convertRTAStatus(status)}`))
        }
        else {
          const sub = { type, sequenceId, status, subscriptionId, data, uri: promise?.data ?? null }
          promise?.resolve(sub)
          this.emit('subscribe', sub)
          this.subscriptions.set(sequenceId, sub)
        }


        break
      }
      case MessageType.Unsubscribe: {
        const [type, sequenceId, status] = msgJson

        const promise = promiseMap.get(sequenceId)

        if (status !== StatusCode.Success) {
          debug('Unsubscribe failed', status)
          promise?.reject(new Error(`Unsubscribe failed with status code ${status} ${convertRTAStatus(status)}`))
          this.emit('error', new Error(`Unsubscribe failed with status code ${status} ${convertRTAStatus(status)}`))
        }
        else {
          promise?.resolve({ type, sequenceId, status })
          this.emit('unsubscribe', { type, sequenceId, status })
          this.subscriptions.delete(sequenceId)
        }


        break
      }
      case MessageType.Event: {
        const [type, subscriptionId, data] = msgJson

        this.emit('event', { type, subscriptionId, data })

        break
      }
      case MessageType.Resync: {
        debug('Recieved resync message', res)
        break
      }
      default:
        debug('Recieved unknown message', res)
        break
    }
  }

  private heartbeat() {
    debug('RTA Pinged')

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
    }

    this.heartbeatTimeout = setTimeout(() => {
      debug('RTA Ping Timeout')
      this.destroy(true)
    }, 30000)
  }
}