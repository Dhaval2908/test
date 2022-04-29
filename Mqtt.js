const mqtt = require('mqtt')
const cron = require('node-cron');
const con = require('./database.js')
const fs = require("fs");

const host = '13.233.193.235'
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
  client.subscribe("TEST", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
  client.subscribe("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})



client.on('message', (topic, payload) => {
  if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/Action") {
   client.publish("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity","40")
       client.publish("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp","34")
       client.publish("REEVA/HYDROPHONICS/34B4724F22C4/EC/EC","1.2")
   client.publish("REEVA/HYDROPHONICS/34B4724F22C4/PH/PH","6.2")


  }
  
})





module.exports = client;
