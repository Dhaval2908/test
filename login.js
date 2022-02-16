const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const logger = require("morgan")
var path = require('path');
var cookieParser = require('cookie-parser');
const app = express();
var jwt = require('jsonwebtoken');

app.use(bodyParser.json());
app.use(logger("dev"))
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/assets", express.static("assets"));
app.use(cookieParser());


const connection = require("./database");
const client = require("./Mqtt");


app.get("/", function (req, res) {
    res.redirect('/index1');
})

app.get('/test', (req, res) => {
    res.render('test', {
        message: ''
    });
});
app.get('/index1', (req, res) => {
    res.render('index1', {
        message: ''
    });
});


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
                    },'test secret',{expiresIn:'3m'});
                    // Set session expiration to 3 hr.
                    console.log(token)
                const expiresIn = 1 * 60 * 60 * 1000;
                const options = {maxAge: expiresIn, httpOnly: true};
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
app.post("/test",  function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    connection.query("select * from test where username = ? ", [username], function (error, results, fields) {
    if(results.length >0)
    {
        res.render("test", {
            message: "User is already exist"
        }); 
    }
    else
    {
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
app.get("/dashboard",isLoggedIn,  function (req, res) {
    var date_ob = new Date();
    let Temp, humidity, time, date, t2, t3, Fan
    client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }

    })
   
    client.on('message', (topic, payload) => {
        if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp") {
            Temp = payload.toString();

        }
        else if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity") {
            humidity = payload.toString();
            console.log(humidity)

        }
        if (Temp > 25) {
            Fan = "ON"
            console.log(Fan)
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "ON:100", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }
        else {
            Fan = "OFF"
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "OFF:0", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }



        let day = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let minute = String(date_ob.getMinutes()).padStart(2, '0');
        time = date_ob.getHours() + ':' + minute + ':' + date_ob.getSeconds();
        date = date_ob.getFullYear() + '/' + month + '/' + day;
        console.log(time)
        console.log(date)
        t2 = "53"
        t3 = "54"


    })


    setTimeout(function () {

        res.render("dashboard", {
            Temp: Temp,
            Humidity: humidity,
            PH: t2,
            EC: t3,
            Time: time,
            Date: date,
            Fan: Fan
        });
    }, 500)

})
// client.on('message', (topic, payload) => {

// location.reload(true);

// })
app.post("/dashboard", encoder, function (req, res) {
    var AirPumpON = req.body.AirPumpON;
    var AirPumpOFF = req.body.AirPumpOFF;

    // client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
    //     if (error) {
    //         console.error(error)
    //     }

    // })
    setTimeout(function () {
        console.log(AirPumpON)
        if (AirPumpON) {
            console.log("t")
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "ON:100", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
            res.redirect("/dashboard")

        }
        if (AirPumpOFF) {
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "OFF:0", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
            res.redirect("/dashboard")

        }

    }, 500);



})

function isLoggedIn(req, res, next) {   //To verify an incoming token from client
    console.log(req.cookies.token);
    try{
        console.log(req.cookies.token);
        jwt.verify(req.cookies.token, 'test secret');  
        return next();
    }
    catch(err){
        console.log(err.message);
        return res.status(401).render('index1',{  //401 Unauthorized Accesss
            message: 'Please Login Again'
        });  
    }
}

app.listen(2000);