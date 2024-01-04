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

  // Recieve events when a session changes with the returned connectionId attached
  const connectionId = await rta.subscribe('https://sessiondirectory.xboxlive.com/connections/')

  console.log(connectionId.data.ConnectionId)

  setTimeout(async () => {
    await rta.destroy()
  }, 45000)

}

main()