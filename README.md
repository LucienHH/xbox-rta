# xbox-rta
[![NPM version](https://img.shields.io/npm/v/xbox-rta.svg)](http://npmjs.com/package/xbox-rta)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/KTyd9HWuBD)

Creates and manages an Xbox RTA (Real Time Activity) connection.

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

### get Connection ID
```js
const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const rta = new XboxRTA(auth);

	await rta.connect();

	const sub = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/');

	console.log(sub.data.ConnectionId);

	setTimeout(async () => {
		await rta.disconnect();
	}, 60000);
};

main();
```

## Debugging

You can enable some debugging output using the `DEBUG` enviroment variable. Through node.js, you can add `process.env.DEBUG = 'xbox-rta'` at the top of your code.

## License

[MIT](LICENSE)
