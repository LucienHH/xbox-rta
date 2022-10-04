const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const rta = new XboxRTA(auth);

	await rta.connect();

	const sub = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/');

	console.log(sub);

	setTimeout(async () => {
		await rta.disconnect();
	}, 60000);

};

main();