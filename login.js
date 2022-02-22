const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const logger = require("morgan")
var path = require('path');
var cookieParser = require('cookie-parser');
const app = express();
var jwt = require('jsonwebtoken');
var fs = require('fs');
const schedule = require("./schedule")


app.use(bodyParser.json());
app.use(logger("dev"))
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/assets", express.static("assets"));
app.use(cookieParser());


const connection = require("./database");
const client = require("./Mqtt");
const test = require("./schedule");



app.get("/", LOGIN, function (req, res) {
    res.redirect('/index1');
})

app.get('/test', LOGIN, (req, res) => {
    res.render('test', {
        message: ''
    });
});
app.get('/index1', LOGIN, (req, res) => {
    res.render('index1', {
        message: ''
    });
});
// var tokenname="token"
app.post("/", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    connection.query("select * from test where username = ? ", [username], function (error, results, fields) {
        console.log(results)
        if (results.length > 0) {
            results.forEach(data => {
                if (data.password == password) {
                    const token = jwt.sign({
                        email: data.username,
                    }, 'test secret', { expiresIn: '1h' });
                    // Set session expiration to 3 hr.
                    console.log(token)
                    const expiresIn = 1 * 60 * 60 * 1000;
                    const options = { maxAge: expiresIn, httpOnly: true };
                    res.cookie('token', token, options);
                    // res.cookie('id', user[0].id, options);
                    res.redirect("/dashboard")
                }
                else {
                    res.render("index1", {
                        message: "Password Does Not Match"
                    });
                }
            });
        }
        else {
            res.render("index1", {
                message: "User Does not exist"
            });
        }
    })
})
app.post("/test", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    connection.query("select * from test where username = ? ", [username], function (error, results, fields) {
        if (results.length > 0) {
            res.render("test", {
                message: "User is already exist"
            });
        }
        else {
            if (password == repassword) {
                connection.query("INSERT INTO test (username, password) VALUES (?, ?);", [username, password], function (error, results, fields) {
                    if (results.length > 0) {
                        res.render("/")

                    }
                    else {
                        res.redirect("/");

                    }
                    res.end();
                })
            }
            else {
                res.render("test", {
                    message: "Password Does Not Match"
                });
            }
        }
    })
})
app.get("/dashboard", isLoggedIn, function (req, res) {
    client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }

    }) 
    setTimeout(() => {
        const data = fs.readFileSync("data.json", 'utf8');
        const DATA = JSON.parse(data)
        const fileData = fs.readFileSync("status.json", 'utf8');
        const object = JSON.parse(fileData)
        console.log(DATA)
        res.render("dashboard", {
            Data : DATA,
            Status: object
        });
    }, 100);
        
   
})

app.post("/dashboard", encoder, function (req, res) {
    var AirPump = req.body.AirPump;
    
    
    client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }

    })      
        console.log("PUMP STATUS :",req.body.AirPump)
        if(AirPump=="ON")
        {
           
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "ON:100", { qos: 0, retain: false }, (error) => {
                
                if (error) {
                    console.error(error)
                }
            })
            const fileData = fs.readFileSync("status.json", 'utf8');
            const object = JSON.parse(fileData)
            fs.writeFileSync("status.json", JSON.stringify({ Pump: "ON" }, null, 2))
        }
        if(AirPump=="OFF")
        {
           
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "OFF:0", { qos: 0, retain: false }, (error) => {
                
                if (error) {
                    console.error(error)
                }
            })
            const fileData = fs.readFileSync("status.json", 'utf8');
            const object = JSON.parse(fileData)
            fs.writeFileSync("status.json", JSON.stringify({ Pump: "OFF" }, null, 2))
        }
       
        setTimeout(() => {
        const data = fs.readFileSync("data.json", 'utf8');
        const DATA = JSON.parse(data)
        const fileData = fs.readFileSync("status.json", 'utf8');
        const object = JSON.parse(fileData)
        res.render("dashboard", {
            Data : DATA,
            Status: object
        });
        }, 500);
        
    

})

app.get('/logout', function (req, res) {
    // localStorage.removeItem(req.cookies.token)
    return res
        .clearCookie('token')
        .status(200)
        .redirect("/");
});
app.get("/schedule", isLoggedIn, function (req, res) {
    const fileData = fs.readFileSync("schedule.json", 'utf8');
    console.log("Length", fileData.length)
    const object = JSON.parse(fileData)

    res.render("schedule", {
        ScheduleData: object
    });
})
test()
app.post("/schedule", isLoggedIn, function (req, res) {
    StartTime = req.body.starttime
    EndTime = req.body.endtime
    StartTime = StartTime.split(":");
    EndTime = EndTime.split(":");
    valid = parseInt(StartTime[0]) + parseInt(StartTime[1]) - parseInt(EndTime[0]) - parseInt(EndTime[1])
    console.log("Valid:", valid)
    if (valid >= 0) {
        console.log("ERROR")
    }
    var date_ob = new Date();
    let minute = String(date_ob.getMinutes()).padStart(2, '0');
    time = date_ob.getHours() + ':' + minute;
    const fileData = fs.readFileSync("schedule.json", 'utf8');
    const object = JSON.parse(fileData)
    if (object.length === 0) {

        fs.writeFileSync("schedule.json", JSON.stringify([{ StartHr: StartTime[0], StartMin: StartTime[1], StartSec: StartTime[2], EndHr: EndTime[0], EndMin: EndTime[1], EndSec: EndTime[2] }], null, 2))
        client.publish("TEST", "1", { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })
    } else {

        object.push({ StartHr: StartTime[0], StartMin: StartTime[1], StartSec: StartTime[2], EndHr: EndTime[0], EndMin: EndTime[1], EndSec: EndTime[2] })
        fs.writeFileSync("schedule.json", JSON.stringify(object, null, 2))
        client.publish("TEST", "1", { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })


    }
    res.redirect("/schedule")
})
client.on('message', (topic, payload) => {
    if (topic === "TEST") {
        console.log("AA gaya")
        test()
    }
})
app.post("/delete", isLoggedIn, function (req, res) {
    const fileData = fs.readFileSync(`schedule.json`, 'utf8');
    const object = JSON.parse(fileData)
    index = object.findIndex(object => object.StartHr == req.query.StartHr && object.StartMin == req.query.StartMin)
    object.splice(index, 1)
    fs.writeFileSync("schedule.json", JSON.stringify(object, null, 2))
    res.redirect("/schedule")
})

function isLoggedIn(req, res, next) {   //To verify an incoming token from client
    console.log(req.cookies.token);
    try {
        console.log(req.cookies.token);
        jwt.verify(req.cookies.token, 'test secret');
        return next();
    }
    catch (err) {
        console.log(err.message);
        return res.status(401).render('index1', {  //401 Unauthorized Accesss
            message: 'Please Login Again'
        });
    }
}
function LOGIN(req, res, next) {   //To verify an incoming token from client
    console.log(req.cookies.token);
    try {
        console.log(req.cookies.token);
        jwt.verify(req.cookies.token, 'test secret');
        return res.redirect("/dashboard");
    }
    catch (err) {
        console.log(err.message);
        return res.status(401).render('index1', {  //401 Unauthorized Accesss
            message: ''
        });
    }
}
app.listen(2000);