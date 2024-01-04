# xbox-rta
[![NPM version](https://img.shields.io/npm/v/xbox-rta.svg)](http://npmjs.com/package/xbox-rta)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/KTyd9HWuBD)

Creates and manages an Xbox RTA (Real Time Activity) connection. This websocket connection allows you to subscribe to events such as when a player's presence changes, when a player's party changes, when a session changes and more.

## Installation
```shell
npm install xbox-rta
```

## Usage

### XboxRTA(authflow)
**Parameters**
- authflow - Takes an **Authflow** instance from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth), you can see the documentation for this [here.](https://github.com/PrismarineJS/prismarine-auth#authflow)

[View more examples](https://github.com/LucienHH/xbox-rta/tree/master/examples)

### Example

### Get Connection ID

When creating or joining a session, you need to provide a connection ID, this allows you to recieve events relating to the session for example when a user joins or when the session is updated. You can get a connection ID by subscribing to the `https://sessiondirectory.xboxlive.com/connections/` endpoint. An example of this being used can be found in [bedrock-portal](https://github.com/LucienHH/bedrock-portal)

```js
const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const rta = new XboxRTA(auth);

	await rta.connect();

	const sub = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/');

	console.log(sub.data.ConnectionId);

	/*
	{
		type: 1,
		sequenceId: 0,
		status: 0,
		subscriptionId: 0,
		data: { ConnectionId: 'd70140fd-7d47-4b5f-b967-fca6c16e71ab' },
		uri: 'https://sessiondirectory.xboxlive.com/connections/'
	}
	*/
};

main();
```
When you subscribe to the `https://sessiondirectory.xboxlive.com/connections/` endpoint, you will recieve a response like this in the `subscribe` event. The `event` event will also be fired when any changes are made to the session the connection ID is associated with.
```json
{
	"type": 1,
	"sequenceId": 0,
	"status": 0,
	"subscriptionId": 0,
	"data": { "ConnectionId": "d70140fd-7d47-4b5f-b967-fca6c16e71ab" },
	"uri": "https://sessiondirectory.xboxlive.com/connections/"
}
```

### Recieve events when a user's presence changes

```js
const { XboxRTA } = require('xbox-rta')
const { Authflow, Titles } = require('prismarine-auth')

const main = async () => {
  const auth = new Authflow('example', './', { authTitle: Titles.XboxAppIOS, deviceType: 'iOS', flow: 'sisu' })

  const rta = new XboxRTA(auth)

  rta.on('subscribe', (data) => {
    console.log(data)
  })

  rta.on('event', (data) => {
    console.log(data)
  })

  await rta.connect()

  await rta.subscribe('https://userpresence.xboxlive.com/users/xuid(<player_xuid>)/richpresence')

}

main()
```
When the player's presence changes, you will recieve an event like this in the `event` event.
```json
{
	"xuid": 1234567890123456,
	"devicetype": "XboxOne",
	"titleid": 0,
	"string1": "Minecraft",
	"string2": "",
	"presenceState": "Online",
	"presenceText": "Minecraft",
	"presenceDetails": [
		{
			"isBroadcasting": false,
			"device": "iOS",
			"presenceText": "Minecraft", 
			"state": "Active", 
			"titleId": "1810924247",
			"isGame": true, 
			"isPrimary": true,
			"richPresenceText": ""
		}
	]
}
```

## Debugging

You can enable some debugging output using the `DEBUG` enviroment variable. Through node.js, you can add `process.env.DEBUG = 'xbox-rta'` at the top of your code.

## License

[MIT](LICENSE)
