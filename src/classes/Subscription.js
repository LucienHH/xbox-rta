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

	async unsubscribe() {
		const response = await this.#rta.unsubscribe(this.subId);
		return response;
	}
}

module.exports = Subscription;