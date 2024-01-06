# xbox-rta
[![NPM version](https://img.shields.io/npm/v/xbox-rta.svg)](http://npmjs.com/package/xbox-rta)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/KTyd9HWuBD)

Creates and manages an Xbox RTA (Real Time Activity) connection. This websocket connection allows you to subscribe to events such as when a player's presence changes, when a player's party changes, when a session changes and more.

# Installation
```shell
npm install xbox-rta
```

# Usage

## XboxRTA(authflow)
**Parameters**
- authflow - Takes an **Authflow** instance from [prismarine-auth](https://github.com/PrismarineJS/prismarine-auth), you can see the documentation for this [here.](https://github.com/PrismarineJS/prismarine-auth#authflow)
```js
const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const authflow = new Authflow('example', './', { authTitle: Titles.XboxAppIOS, deviceType: 'iOS', flow: 'sisu' });

const rta = new XboxRTA(authflow);
```

### Events

A list of events that can be emitted by the XboxRTA class can be found below.

- 'subscribe' - emitted when a resource has been subscribed
- 'unsubscribe' - emitted when a resource has been unsubscribed
- 'event' - emitted when an event has been recieved from a subscribed resource
- 'error' - emitted when an error has occured with a subscription

```js
rta.on('subscribe', (data) => {
	console.log(data);
});

rta.on('unsubscribe', (data) => {
	console.log(data);
});

rta.on('event', (data) => {
	console.log(data);
});

rta.on('error', (data) => {
	console.log(data);
});
```

### Methods

A list of methods that can be called on the XboxRTA class can be found below.

#### #.connect()
Connects to the Xbox RTA service. This method should be called before any other methods. 

```js
await rta.connect();
```

#### #.subscribe(resource)
Subscribes to a resource. This method should be called after the `connect` method has been called.

**Parameters**
- resource - The resource to subscribe to, this should be a valid RTA resource. A list of valid resources can be found [here.](https://docs.microsoft.com/en-us/gaming/xbox-live/real-time-activity/resource-uri-schema)

```js
const sub = await rta.subscribe('https://userpresence.xboxlive.com/users/xuid(<player_xuid>)/richpresence');
```

#### #.unsubscribe(subscriptionId)
Unsubscribes from a resource. This method should be called after the `connect` method has been called.

**Parameters**
- subscriptionId - The subscription ID of the resource to unsubscribe from. This can be found in the `subscribe` event or in the `subscriptionId` property of the `subscribed` response.

```js
await rta.unsubscribe(sub.subscriptionId);
```

#### #.destroy()
Destroys the connection to the Xbox RTA service. This method should be called when you are finished with the XboxRTA instance.

```js
await rta.destroy();
```

Full code

```js
const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.XboxAppIOS, deviceType: 'iOS', flow: 'sisu' });

	const rta = new XboxRTA(auth);

	rta.on('subscribe', (data) => {
		console.log(data);
	});

	rta.on('unsubscribe', (data) => {
		console.log(data);
	});

	rta.on('event', (data) => {
		console.log(data);
	});

	rta.on('error', (data) => {
		console.log(data);
	});

	await rta.connect();

	const sub = await rta.subscribe('https://userpresence.xboxlive.com/users/xuid(<player_xuid>)/richpresence');

	setTimeout(async () => {
		await rta.unsubscribe(sub.subscriptionId);
	}, 60000); // Unsubscribe after 1 minute

	setTimeout(async () => {
		await rta.destroy();
	}, 120000); // Destroy the connection after 2 minutes
};

main();
```

## Example

[View more examples](https://github.com/LucienHH/xbox-rta/tree/master/examples)

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
