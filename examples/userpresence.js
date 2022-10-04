const { XboxRTA } = require('xbox-rta');
const { Authflow, Titles } = require('prismarine-auth');

const main = async () => {
	const auth = new Authflow('example', './', { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo' });

	const rta = new XboxRTA(auth);

	await rta.connect();

	const sub = await rta.subscribe('https://userpresence.xboxlive.com/users/xuid(2535451524524264)/richpresence');

	console.log(sub);

	const eventListener = sub.createEventListener({ timeout: 60000 });

	eventListener.on('data', (data) => {
		console.log('DATA: ', data);
	});

	setTimeout(async () => {
		await rta.disconnect();
	}, 120000);

};

main();