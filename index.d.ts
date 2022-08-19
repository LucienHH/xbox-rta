/// <reference types="node" />
import websocket from 'ws'
declare module 'xbox-rta' {
  export class XboxRTA {
    /**
     * Creates a new RealmAPI instance, which handles and authenticates calls to the Realms API
     * @param authflow An Authflow instance from [xbox-auth](https://github.com/PrismarineJS/prismarine-auth).
     * @param options Which platforms API to access
     */
    constructor(authflow: Authflow, options = {})

    from(authflow: Authflow, options = {}): Client  

  }

  export class Client extends websocket {

  }
}
