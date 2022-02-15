const mqtt = require('mqtt')
const cron = require('node-cron');
// const con = require('./database.js')

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
  client.subscribe("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
  client.subscribe("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})

var flag = 0
var time = 0
var date = 0
cron.schedule('0 */5 * * * *', () => {
  console.log("Calling")
  //  '0 */5 * * * *
  getdata();

});
var Temp, humidity
function getdata() {
  client.publish(topic, "1", { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })

}
cron.schedule('0 11 * * *', () => {
  console.log("LIGHT ON")
  client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "ON:100", { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })
});
cron.schedule('00 24 * * *', () => {
  console.log("LIGHT OFF")
  client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "OFF:0", { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })

});

client.on('message', (topic, payload) => {

  console.log(payload.toString())
  if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp") {
    Temp = payload.toString();
    flag++;
  }
  else if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity") {
    humidity = payload.toString();
    console.log(humidity)
    flag++;


  }
  console.log("flag", flag)

  // if (flag == 2) {
  //   console.log(flag)
  //   savedata(Temp, humidity)
  // }

})


module.exports = client;
