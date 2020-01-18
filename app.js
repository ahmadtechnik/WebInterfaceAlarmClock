const express = require('express');
const jsonfile = require("jsonfile");
const path = require("path");
const Omx = require("node-omxplayer");
const bodyParser = require('body-parser');
const fs = require("fs");




const app = express();
const port = 3000;
var invertals = {};

//
app.use(express.static(__dirname + path.join("/", "views")));
app.use(express.static(__dirname + path.join("/", "node_modules")));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
// GLOBALS 
const alarmsFilePath = path.join(__dirname, "views", "assets", "alarms.json");
const mp3DirPath = path.join(__dirname, "views", "assets", "mp3");
const mp3FilePath = path.join(__dirname, "views", "assets", "mp3", "/");
const settingsFilePath = path.join(__dirname, "views", "assets", "settings.json");



var exist_file_data = null;
var player = null;
var osType = process.platform;
var is_running = false;
var running_requsted_period = 1000 * 60;
//CALL FUNCTIONS
invertals.timer_check = setTimeout(startIntervalAlarms, 1000);

/**
 * 
 */
migration_files();


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
    var alarm_clip = passed_data.alarm_selected_clip;

    // write new alarm data to file
    var exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    exist_file_data.push({
        alarm_name: encodeURI(alarm_name),
        alarm_in: alarm_data,
        alarm_date: alarm_date,
        active: 1,
        repeats: [],
        mp3_clip: parseInt(alarm_clip)
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

app.post("/getMp3ClipsList", (req, res) => {
    res.send(get_all_mp3_sounds());
})

app.post("/changeAlarmMp3Clip", (req, res) => {
    var passed_data = req.body;
    var selected_clip_index = passed_data.selected_index;
    var selected_alarm_index = passed_data.selected_alarm;
    var alarmsDB = jsonfile.readFileSync(alarmsFilePath);
    alarmsDB[selected_alarm_index].mp3_clip = parseInt(selected_clip_index);
    jsonfile.writeFileSync(alarmsFilePath, alarmsDB);

    play_song(selected_clip_index);

    res.send();
});
/**
 * 
 */
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});

/**
 * 
 */
function startIntervalAlarms() {
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
                        play_song(dateObject.mp3_clip); // play music 
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

    killPlayer();
}

/**
 * 
 * 
 */
function play_song(clip_index) {
    const { exec } = require('child_process');

    killPlayer();
    if (typeof clip_index === "string") {
        clip_index = parseInt(clip_index);
    }

    var file_to_play = mp3FilePath + get_all_mp3_sounds()[clip_index];
    switch (osType) {
        case "linux":
            player = Omx(file_to_play, "local", true);
            break;
        case "win32":
            exec('fmedia.exe ' + file_to_play + " && timeout 5 && taskkill /im fmedia.exe");
            break;
    };

}


function killPlayer() {
    const { exec } = require('child_process');
    var order = "";
    switch (osType) {
        case "win32":
            order = 'tasklist | find /i "fmedia.exe" && timeout 5 && taskkill /im fmedia.exe /F || echo process " fmedia.exe" not running.';
            break;
        case "linux":
            order = "killall omxplayer.bin";
            break;
    }
    exec(order);
    // change_settings_options({ alarm_active: 1 })
}

/**
 * 
 */
function migration_files() {
    // create alarms json file if not exist
    fs.exists(alarmsFilePath, (exists) => {
        if (!exists) {
            fs.writeFileSync(alarmsFilePath, "[]");
            console.log(alarmsFilePath + " file created")
        }
    });
    // create settings json file if not exist
    fs.exists(settingsFilePath, (exist) => {
        if (!exist) {
            fs.writeFileSync(settingsFilePath, JSON.stringify({
                volume: 0,
                alarm_active: 0,
                mp3_clips: get_all_mp3_sounds()
            }));
        }
    });
}
/**
 * 
 */
function get_all_mp3_sounds() {
    return fs.readdirSync(mp3DirPath);
}

function change_settings_options(option) {
    var exist_settings_file = jsonfile.readFileSync(settingsFilePath);
    var newSettingsObject = {...exist_settings_file, ...option };
    jsonfile.writeFileSync(settingsFilePath, newSettingsObject);
}