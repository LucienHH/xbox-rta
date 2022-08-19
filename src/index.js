const Client = require('./client.js');

class XboxRTA {
	static async from(authflow, options = {}) {
		return new Client('wss://rta.xboxlive.com/connect', authflow);
	}
}

module.exports = XboxRTA;
