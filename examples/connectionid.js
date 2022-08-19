const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('test', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const rta = await XboxRTA.from(auth);

	await rta.connect();

	const sub = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/');

	console.log(sub);

	setTimeout(async () => {
		await sub.unsubscribe().then(console.log);
	}, 60000);

};

main();