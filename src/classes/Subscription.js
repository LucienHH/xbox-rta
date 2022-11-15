const { EventEmitter } = require('events');

class Subscription {
	#rta;
	constructor(rta, response) {
		this.#rta = rta;
		this.id = response.subId;
		this.sequence = response.sequence;
		this.code = response.code;
		this.data = response.data;
	}

	createEventListener({ timeout } = {}) {
		const listener = new EventEmitter();

		const cb = (data) => data.subId === this.id ? listener.emit('data', data) : null;
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
		const response = await this.#rta.unsubscribe(this.id);
		return response;
	}
}

module.exports = Subscription;