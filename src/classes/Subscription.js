const { EventEmitter } = require('events');

class Subscription {
	#rta;
	constructor(rta, response) {
		this.#rta = rta;
		this.type = response.type;
		this.sequence = response.sequence;
		this.code = response.code;
		this.subId = response.subId;
		this.data = response.data;
	}

	createEventListener({ timeout } = {}) {
		const listener = new EventEmitter();

		const cb = (data) => data.subId === this.subId ? listener.emit('data', data) : null;
		this.#rta.on('event', cb);

		if (timeout) {
			setTimeout(() => {
				listener.removeAllListeners();
				this.#rta.removeListener('event', cb);
			}, timeout);
		}

		return listener;
	}

	async unsubscribe() {
		const response = await this.#rta.unsubscribe(this.subId);
		return response;
	}
}

module.exports = Subscription;