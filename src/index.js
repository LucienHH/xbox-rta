const debug = require('debug')('xbox-rta');

const RTAClient = require('./client.js');
const Subscription = require('./classes/Subscription.js');

const { RTATypes } = require('./common/constants');

class XboxRTA extends RTAClient {
	constructor(authflow, options = {}) {
		super('wss://rta.xboxlive.com/connect', authflow, options);
	}

	async connect() {
		await this.init();
	}

	async disconnect() {
		for (const sub of this.subscribitions.values()) {
			await sub.unsubscribe();
		}

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
