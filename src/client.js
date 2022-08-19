const WebSocket = require('ws');
const { EventEmitter } = require('events');

const Subscription = require('./classes/Subscription.js');

const RTATypes = {
	SUBSCRIBE: 1,
	UNSUBSCRIBE: 2,
	EVENT: 3,
	RESYNC: 4,
};

module.exports = class Client extends EventEmitter {
	constructor(address, authflow) {
		super();
		this.address = address;
		this.authflow = authflow;
		this.pingTimeout;
		this.subscribitions = new Map();
		this.mapper = new Map();
		this.sequenceN = 1;
		this.sendQueue = [];
	}

	async connect() {
		const auth = await this.authflow.getXboxToken('http://xboxlive.com');

		this.ws = new WebSocket(this.address, { headers: { authorization: `XBL3.0 x=${auth.userHash};${auth.XSTSToken}` } });

		this.ws.once('open', () => {
			setTimeout(() => {
				console.log(`Reconnecting to ${this.address}`);
				this.reconnect();
			}, 90 * 60 * 1000); // 90 minutes
			console.log(`RTA Connected to ${this.address}`);
			this.sendQueue.forEach(message => this.ws.send(message));
			this.sendQueue = [];
		});

		this.ws.on('pong', this._heartbeat);

		this.ws.on('close', () => {
			console.log(`RTA Disconnected from ${this.address}`);
			this.reconnect();
		});

		this.ws.on('error', err => {
			console.log('RTA Error', err);
		});

		this.ws.on('message', (data) => this._handleMessage(data));

	}

	reconnect() {
		clearTimeout(this.pingTimeout);
		this.ws.removeAllListeners();
		this.ws.close();
		this.connect();
	}

	send(data) {
		if (this.ws?.readyState === WebSocket.OPEN) return this.ws.send(data);

		this.sendQueue.push(data);
	}

	async subscribe(uri, options = {}) {
		const seqN = this.sequenceN++;

		console.log('Subscribing', uri);

		const response = await this._awaitResponse(`[${RTATypes.SUBSCRIBE}, ${seqN}, "${uri}"]`, seqN);

		const sub = new Subscription(this, response);

		this.subscribitions.set(response.subId, sub);

		return sub;

	}

	async unsubscribe(subId) {
		const seqN = this.sequenceN++;

		console.log('Unsubscribing', subId);

		return await this._awaitResponse(`[${RTATypes.UNSUBSCRIBE}, ${seqN}, ${subId}]`, seqN);
	}

	async _awaitResponse(payload, seqN) {
		return await new Promise((resolve, reject) => {
			setTimeout(() => reject(new Error('Timeout')), 30000);
			this.mapper.set(seqN, resolve);
			this.send(payload);
		});
	}

	// async _getNonce() {
	// 	// return await this.xbot.xbox.api.get('https://rta.xboxlive.com/nonce').then(res => res.nonce);
	// }

	_handleMessage(res) {
		const msgJson = JSON.parse(res);
		const messageType = msgJson[0];

		console.log('Recieved message', String(res));

		switch (messageType) {
			case 1: {
			// sub
				const [typeId, sequenceN, codeN, subId, data] = msgJson;

				const resolve = this.mapper.get(sequenceN);
				resolve({
					type: typeId,
					sequence: sequenceN,
					code: codeN,
					subId,
					data,
				});

				break;
			}
			case 2: {
			// unsub
				const [typeId, sequenceN, codeN] = msgJson;

				const resolve = this.mapper.get(sequenceN);
				resolve({
					type: typeId,
					sequence: sequenceN,
					code: codeN,
				});

				break;
			}
			case 3: {
			// event
				const [typeId, subId, data] = msgJson;

				this.emit('event', {
					type: typeId,
					subId,
					data,
				});

				// if (this.subscribitions.has(subId)) {
				// 	const timeout = this.subscribitions.get(subId);
				// 	timeout.refresh();
				// }

				// const resolve = this.events.get(subId);

				// if (!resolve) break;

				// resolve(data);
				break;
			}
			case 4: {
			// resync
				console.log('Recieved resync message', res);
				break;
			}
			default:
				console.log('Recieved unknown message', res);
				break;
		}
	}

	_heartbeat() {
		console.log('RTA Pinged');
		clearTimeout(this.pingTimeout);
		this.pingTimeout = setTimeout(() => {
			console.log('RTA Ping Timeout');
			this.terminate();
		}, 31000);
	}
};