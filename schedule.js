var schedule = require("node-schedule");
var fs = require('fs');
const fileData = fs.readFileSync("schedule.json", 'utf8');
var client = require("./Mqtt")
console.log(fileData)
if(fileData.length >0)  
{
  const object = JSON.parse(fileData)
  object.forEach(data => {
    console.log(data.StartMin)
    console.log(data.StartHr)
    console.log(data.EndHr)
    console.log(data.EndMin)
     const job = schedule.scheduleJob({hour: parseInt(data.StartHr), minute: parseInt(data.StartMin)}, function(){
      client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "ON:100", { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }); 
    const job1 = schedule.scheduleJob({hour: parseInt(data.EndHr), minute: parseInt(data.EndMin)}, function(){
      client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "OFF:0", { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }); 
  });
  
}  
     