var schedule = require("node-schedule");
var fs = require('fs');
var client = require("./Mqtt");
const { Console } = require("console");
function test()
{
  const fileData = fs.readFileSync("schedule.json", 'utf8');

console.log(fileData)
if(fileData.length >0)  
{
  const object = JSON.parse(fileData)
  object.forEach(data => {
    console.log(data.StartHr)
    console.log(data.StartSec)
    console.log(data.StartMin)
    console.log(data.EndHr)
    console.log(data.EndMin)
    console.log(data.EndSec)
    const job = schedule.scheduleJob({hour: parseInt(data.StartHr), minute: parseInt(data.StartMin),second :parseInt(data.StartSec)}, function(){
      client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "ON:100", { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }); 
    const job1 = schedule.scheduleJob({hour: parseInt(data.EndHr), minute: parseInt(data.EndMin),second :parseInt(data.EndSec)}, function(){
      client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "OFF:0", { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }); 
  });
  
}  
}

     
module.exports = test;