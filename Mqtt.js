const mqtt = require('mqtt')
const cron = require('node-cron');
const con = require('./database.js')
const fs = require("fs");

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

client.on('message', (topic, payload) => {

  console.log(payload.toString())
  if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp") {
    Temp = payload.toString();
  
  }
  else if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity") {
    humidity = payload.toString();
    console.log(humidity)
  }
  setTimeout(() => {
    savedata(Temp,humidity)
  }, 100);

 

})



function savedata(Temp, humidity, Pump) {
  var date_ob = new Date();
  flag = 0
  console.log("humidity", humidity)
  if (humidity === 'NULL') {
    humidity = '5.5'
  }
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let minute = String(date_ob.getMinutes()).padStart(2, '0');
  time = date_ob.getHours() + ':' + minute + ':' + date_ob.getSeconds();
  date = date_ob.getFullYear() + '/' + month + '/' + day;
  console.log(time)
  console.log(date)
  var t2 = "53"
  var t3 = "54"
  console.log(Temp)
  if (Temp > 28) {
    Fan = "ON"
    console.log(Fan)
    client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "ON:100", { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }
  else {
    Fan = "OFF"
    client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "OFF:0", { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }
  //Temp="22.0"
  console.log(Fan)
  var sql = "INSERT INTO data (Temp,Humidity,EC,PH,Time,Date,Fan) VALUES (?,?,?,?,?,?,?);"
  con.query(sql, [Temp, humidity, t2, t3, time, date, Fan], function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });

  // const fileData = fs.readFileSync("data.json", 'utf8');
  // const object = JSON.parse(fileData)
  fs.writeFileSync("data.json", JSON.stringify([{Temp:Temp,Humidity:humidity,EC:t2,PH:t3,Time:time,Date:date,Fan:Fan}], null, 2))


  time = 0
  Fan = ""
  console.log(time)
}



module.exports = client;
