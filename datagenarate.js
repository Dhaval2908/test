
const mqtt = require('mqtt')


const host = '13.235.26.80'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
})
const topic = "REEVA/HYDROPHONICS/34B4724F22C4/Action"
client.on('connect', () => {
  console.log('Connected')
  client.subscribe("REEVA/HYDROPHONICS/34B4724F22C4/Action", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})
    client.on('message', (topic, payload) => {
      client.publish("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp","15")
      client.publish("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity","20")

    })



module.exports = client;

