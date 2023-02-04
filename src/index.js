const debug = require('debug')('xbox-rta');
const WebSocket = require('ws');

const RTAClient = require('./client.js');
const Subscription = require('./classes/Subscription.js');

const { RTATypes } = require('./common/constants');

class XboxRTA extends RTAClient {
	constructor(authflow, options = {}) {
		super('wss://rta.xboxlive.com/connect', authflow, options);
	}

	async connect() {
		if (this.ws?.readyState === WebSocket.OPEN) throw new Error(`Already connected to ${this.address}`);
		await this.init();
	}

	async disconnect() {
		if (this.ws?.readyState !== WebSocket.OPEN) throw new Error(`Not connected to ${this.address}`);
		for (const sub of this.subscribitions.values()) {
			await sub.unsubscribe();
		}

		clearTimeout(this.reconnectTimeout);
		clearTimeout(this.pingTimeout);

		debug('Disconnecting from RTA');

		this.ws.close();
	}

	async subscribe(uri, options = {}) {
		const seqN = this.sequenceN++;

		debug('Subscribing', uri);

		const response = await this.awaitResponse(`[${RTATypes.SUBSCRIBE}, ${seqN}, "${uri}"]`, seqN);

		const sub = new Subscription(this, response);

		this.subscribitions.set(response.subId, sub);

		return sub;
	}

	async unsubscribe(subId) {
		const seqN = this.sequenceN++;

		debug('Unsubscribing', subId);

		this.subscribitions.delete(subId);

		return await this.awaitResponse(`[${RTATypes.UNSUBSCRIBE}, ${seqN}, ${subId}]`, seqN);
	}
}

module.exports = XboxRTA;
