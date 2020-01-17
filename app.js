const express = require('express');
const jsonfile = require("jsonfile");
const path = require("path");
const Omx = require("node-omxplayer");
var bodyParser = require('body-parser');
var multer = require('multer');

const app = express();
const port = 3000;
var invertals = {};



//
app.use(express.static(__dirname + path.join("/", "views")));
app.use(express.static(__dirname + path.join("/", "node_modules")));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
// GLOBALS 
var alarmsFilePath = path.join(__dirname, "views", "assets", "alarms.json");
var mp3FilePath = path.join(__dirname, "views", "assets", "mp3", "Jingle.mp3");
var exist_file_data = null;
var player = null;
var osType = process.platform;


//CALL FUNCTIONS
invertals["timer_check"] = setInterval(() => {
    startIntervalAlarms();
}, 1000);
/**
 * handel get main page requst
 */
app.get('/', (req, res) => {
    res.sendFile("index.html");
});

/**
 * Handel request to add new alarm to list
 */
app.post("/addNewTimer", (req, res) => {
    var passed_data = req.body;
    var alarm_data = passed_data.alarm_data;
    var alarm_date = passed_data.alarm_date
        // write new alarm data to file
    var exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    exist_file_data.push({
        alarm_in: alarm_data,
        alarm_date: alarm_date,
        active: 1,
        repeats: []
    });
    jsonfile.writeFileSync(alarmsFilePath, exist_file_data)

    res.send({
        "data": alarm_data
    });
});
/**
 * 
 */
app.post("/removeAlarm", (req, res) => {
    var passed_data = req.body;
    var selected_alarm = jsonfile.readFileSync(alarmsFilePath);
    selected_alarm[passed_data.index] = "";

    jsonfile.writeFileSync(alarmsFilePath, selected_alarm);
    res.send("")
});
/**
 * 
 */

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});

/**
 * backend prossec
 */
var is_running = false;
/**
 * 
 */
function startIntervalAlarms() {
    exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    var h_now = new Date().getHours();
    var m_now = new Date().getMinutes();
    var s_now = new Date().getSeconds();

    if (exist_file_data.length > 0) {
        exist_file_data.forEach(dateObject => {
            if (typeof dateObject === "object") {
                var h = new Date(dateObject.alarm_date).getHours();
                var m = new Date(dateObject.alarm_date).getMinutes();
                var s = new Date(dateObject.alarm_date).getSeconds();
                if (!is_running) {
                    if (h === h_now && m_now === m) {
                        play_song();
                        invertals["timer_check"] = setInterval(() => {
                            startIntervalAlarms();
                            console.log("Interval set to 60 secound..")
                        }, 1000 * 60);
                        is_running = true;
                    } else {
                        invertals["timer_check"] = setInterval(() => {
                            startIntervalAlarms();
                        }, 1000);
                        is_running = false;
                    }
                }
            }
        });
    }
}

/**
 * 
 * 
 */
function play_song() {
    if (osType === "linux") {
        player = Omx(mp3FilePath, "both", true);
    } else {
        console.log("Not able to start OMX on windows...");
    }
}