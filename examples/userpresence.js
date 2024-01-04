process.env.DEBUG = 'xbox-rta'

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

  // Recieve events when the user's presence changes
  await rta.subscribe('https://userpresence.xboxlive.com/users/xuid(2535451524524264)/richpresence')

  setTimeout(async () => {
    await rta.destroy()
  }, 30000)

}

main()