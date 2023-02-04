const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });

	const rta = new XboxRTA(auth);

	await rta.connect();

	const sub = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/');

	console.log(sub);

	setTimeout(async () => {
		console.log('Unsubscribing');
		await rta.disconnect();
	}, 15000);

};

main();