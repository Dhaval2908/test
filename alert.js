const schedule = require('node-schedule');

const job = schedule.scheduleJob({hour: 13, minute: 58, second:05}, function(){
    console.log('Time for tea!');
  });