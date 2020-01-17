const express = require('express');
const jsonfile = require("jsonfile");
const path = require("path");
const Omx = require("node-omxplayer");
var bodyParser = require('body-parser');


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
var is_running = false;
var running_requsted_period = 1000 * 60;
//CALL FUNCTIONS
invertals.timer_check = setTimeout(startIntervalAlarms, 1000);

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
    // clear player object
    var passed_data = req.body;
    var alarm_data = passed_data.alarm_data;
    var alarm_date = passed_data.alarm_date;
    var alarm_name = passed_data.alarm_name;
    // write new alarm data to file
    var exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    exist_file_data.push({
        alarm_name: encodeURI(alarm_name),
        alarm_in: alarm_data,
        alarm_date: alarm_date,
        active: 1,
        repeats: []
    });
    jsonfile.writeFileSync(alarmsFilePath, exist_file_data)

    res.send({
        "data": alarm_data,
        alarmRunning: is_running
    });
});

/**
 * 
 */
app.post("/removeAlarm", (req, res) => {
    // clear player object
    reset_obects();
    var passed_data = req.body;
    var selected_index = passed_data.index;
    var selected_alarm = jsonfile.readFileSync(alarmsFilePath);
    selected_alarm.splice(selected_index, 1);
    jsonfile.writeFileSync(alarmsFilePath, selected_alarm);
    res.send({
        alarmRunning: is_running
    })
});

/**
 * 
 */
app.post("/disableEnableAlarm", (req, res) => {
    // clear player object
    if (player !== null) {
        player.quit();
        player = null;
    }
    var passed_data = req.body;
    var e_index = passed_data.e_index;
    var newValue = passed_data.e_new_value;
    var selected_alarm = jsonfile.readFileSync(alarmsFilePath);
    selected_alarm[e_index]["active"] = parseInt(newValue);
    jsonfile.writeFileSync(alarmsFilePath, selected_alarm);

    res.send("");
});
/**
 * 
 */
app.post("/addAlarmNote", (req, res) => {
    var passed_data = req.body;
    var index = passed_data.index;
    var content = passed_data.content;
    var selected_alarm = jsonfile.readFileSync(alarmsFilePath);
    selected_alarm[index]["notes"] = content;
    jsonfile.writeFileSync(alarmsFilePath, selected_alarm);
    res.send("");
})

/**
 * 
 */
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});

/**
 * backend prossec
 */

/**
 * 
 */
function startIntervalAlarms() {
    console.log("running")
    clearTimeout(invertals.timer_check);
    //
    invertals.timer_check = setTimeout(startIntervalAlarms, 1000);
    //
    exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    //
    var h_now = new Date().getHours();
    var m_now = new Date().getMinutes();
    var s_now = new Date().getSeconds();
    //
    if (exist_file_data.length > 0) {
        exist_file_data.forEach((dateObject, i) => {
            if (typeof dateObject === "object") {
                if (dateObject["active"] === 1) {
                    //
                    var h = new Date(dateObject.alarm_date).getHours();
                    var m = new Date(dateObject.alarm_date).getMinutes();
                    var s = new Date(dateObject.alarm_date).getSeconds();
                    // if there is an active alarm .. 
                    if (h === h_now && m_now === m) {
                        play_song(); // play music 
                        clearTimeout(invertals.timer_check);
                        invertals.timer_check = setTimeout(startIntervalAlarms, running_requsted_period); // set the timer to 2 mins
                        runningAlarmIndex = i;
                    }
                }
            }
        });
    }
}

/**
 * 
 */
function reset_obects() {
    // clear player object
    if (player !== null) {
        player.quit();
    }
    player = null;
    runningAlarmIndex = null
    is_running = false;
    startIntervalAlarms();
}

/**
 * 
 * 
 */
function play_song() {
    if (player !== null) {
        player = null;
        player.quit();
    }
    if (osType === "linux") {
        player = Omx(mp3FilePath, "local", true);
    } else {
        console.log("Not able to start OMX on windows...");
    }
}