const debug = require('debug')('xbox-rta');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

const { RTATypes } = require('./common/constants');

module.exports = class RTAClient extends EventEmitter {
	constructor(address, authflow) {
		super();
		this.authflow = authflow;
		this.address = address;
		this.pingTimeout;
		this.subscribitions = new Map();
		this.mapper = new Map();
		this.sequenceN = 1;
		this.sendQueue = [];
	}

	async init() {
		this.authflow.xbl.forceRefresh = true;
		const xbl = await this.authflow.getXboxToken('http://xboxlive.com');
		this.authflow.xbl.forceRefresh = false;

		this.ws = new WebSocket(this.address, { headers: { authorization: `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}` } });

		this.ws.once('open', () => {
			setTimeout(() => {
				debug(`Reconnecting to ${this.address}`);
				this.reconnect();
			}, 90 * 60 * 1000); // 90 minutes
			debug(`RTA Connected to ${this.address}`);
			this.sendQueue.forEach(message => this.ws.send(message));
			this.sendQueue = [];
		});

		this.ws.on('pong', () => this._heartbeat());

		this.ws.on('close', () => debug(`RTA Disconnected from ${this.address}`));

		this.ws.on('error', err => debug('RTA Error', err));

		this.ws.on('message', (data) => this.handleMessage(data));

	}

	reconnect() {
		clearTimeout(this.pingTimeout);
		this.ws.removeAllListeners();
		this.ws.close();
		this.init().then(() => this.emit('reconnect'));
	}

	send(data) {
		if (this.ws?.readyState === WebSocket.OPEN) return this.ws.send(data);

		this.sendQueue.push(data);
	}

	async awaitResponse(payload, seqN) {
		return await new Promise((resolve, reject) => {
			setTimeout(() => reject(new Error('Timeout')), 30000);
			this.mapper.set(seqN, resolve);
			this.send(payload);
		});
	}

	// async _getNonce() {
	// 	// return await this.xbot.xbox.api.get('https://rta.xboxlive.com/nonce').then(res => res.nonce);
	// }

	handleMessage(res) {
		this._heartbeat();

		const msgJson = JSON.parse(res);
		const messageType = msgJson[0];

		debug('Recieved message', String(res));

		switch (messageType) {
			case RTATypes.SUBSCRIBE: {
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
			case RTATypes.UNSUBSCRIBE: {
				const [typeId, sequenceN, codeN] = msgJson;

				const resolve = this.mapper.get(sequenceN);
				resolve({
					type: typeId,
					sequence: sequenceN,
					code: codeN,
				});

				break;
			}
			case RTATypes.EVENT: {
				const [typeId, subId, data] = msgJson;

				this.emit('event', {
					type: typeId,
					subId,
					data,
				});

				break;
			}
			case RTATypes.RESYNC: {
				debug('Recieved resync message', res);
				break;
			}
			default:
				debug('Recieved unknown message', res);
				break;
		}
	}

	_heartbeat() {
		debug('RTA Pinged');
		clearTimeout(this.pingTimeout);
		this.pingTimeout = setTimeout(() => {
			debug('RTA Ping Timeout');
			this.ws.terminate();
		}, 31000);
	}
};