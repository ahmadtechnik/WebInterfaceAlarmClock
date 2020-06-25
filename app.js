const express = require('express');
const jsonfile = require("jsonfile");
const path = require("path");
const Omx = require("node-omxplayer");
const bodyParser = require('body-parser');
const fs = require("fs");


//
const app = express();
const port = 80;
var invertals = {};

const http = require("http").createServer(app);
const io = require("socket.io")(http);
const net = require("net");




// USE for express 
app.use(express.static(__dirname + path.join("/", "views")));
app.use(express.static(__dirname + path.join("/", "node_modules")));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
// GLOBALS 
const alarmsFilePath = path.join(__dirname, "views", "assets", "alarms.json");
const mp3DirPath = path.join(__dirname, "views", "assets", "mp3");
const mp3FilePath = path.join(__dirname, "views", "assets", "mp3", "/");
const settingsFilePath = path.join(__dirname, "views", "assets", "settings.json");


//
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
http.listen(port, "0.0.0.0", () => {
    console.log(`Example app listening on port ${port} !`)
});



/**
 * 
 */
migration_files();

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
    killPlayer();
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
    console.log("Requsted disableEnableAlarm")
    killPlayer();
    var passed_data = req.body;
    if (!passed_data.onlyKill) {
        var e_index = passed_data.e_index;
        var newValue = passed_data.e_new_value;
        var selected_alarm = jsonfile.readFileSync(alarmsFilePath);
        selected_alarm[e_index]["active"] = parseInt(newValue);
        jsonfile.writeFileSync(alarmsFilePath, selected_alarm);
    }
    res.send("Hello From Server");
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

app.post("/isAlarmRunning", (req, res) => {
    isRunning('fmedia.exe', 'omxplayer', 'omxplayer').then((v) => {
        res.send(v);
    });
});

app.post("/snoozeTimer", (req, res) => {
    killPlayer();
    var passed_data = req.body;
    invertals.snoze_timer = setTimeout(() => {
        play_song(0);
    }, passed_data.selected_period * 60 * 1000);
    res.send("_" + passed_data.selected_period * 60 * 1000)
});




/** REQUESTS  FROM AI DEVICE  */
//
app.post("/stopAllAlarms", (req, res) => {
    var passed_data = req.body;
    console.log(passed_data)
    console.log("will stop all alarms...")
    removeAutomaticlyAddedAlarms();
    console.log("Player will be killed ....");
    killPlayer();
    var exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    exist_file_data = exist_file_data.map((singleAlarm, i) => {
        if (singleAlarm.active) {
            singleAlarm.active = 0;
        }
        return singleAlarm;
    });
    jsonfile.writeFileSync(alarmsFilePath, exist_file_data);
    console.log("ALL ALARMS DIABLED ...")
    res.send("DONE.");
});
//
app.post("/add8HoursAlarm", (req, res) => {
    removeAutomaticlyAddedAlarms();
    var exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    const eghtHoutsMill = 60 * 60 * 1 * 1000;
    const eghtHoutsMill_ = 120000;
    let date_now = new Date().getTime()
    let date_after_8_hours = date_now + eghtHoutsMill_;
    console.log(new Date(date_after_8_hours).toString())
    exist_file_data.push({
        alarm_name: '#AUTOMETED#',
        alarm_in: 'AUTO',
        alarm_date: new Date(date_after_8_hours).toString(),
        active: 1,
        repeats: [],
        mp3_clip: 20,
        notes: new Date(date_after_8_hours).toString()
    });
    jsonfile.writeFileSync(alarmsFilePath, exist_file_data);
    res.send("DONE..");
});
//
app.post("/removeAutomaticlyAddedAlarms", (req, res) => {
    removeAutomaticlyAddedAlarms();
    res.send("DONE...");
});

let removeAutomaticlyAddedAlarms = () => {
    var exist_file_data = jsonfile.readFileSync(alarmsFilePath);
    exist_file_data = exist_file_data.filter((singleAlarm) => {
        if (singleAlarm.alarm_name != "#AUTOMETED#") {
            return singleAlarm;
        }
    });
    jsonfile.writeFileSync(alarmsFilePath, exist_file_data);
}



/********* END REQUESTS FROM AI DEVICE ********** */


/**
 * 
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
                        clearTimeout(invertals.timer_check);
                        play_song(dateObject.mp3_clip); // play music 
                        invertals.timer_check = setTimeout(startIntervalAlarms, running_requsted_period); // set the timer to 2 mins
                        runningAlarmIndex = i;
                    }
                }
            }
        });
    }
}

/**
 * //
 * 
 */
function play_song(clip_index) {
    killPlayer();
    const { exec } = require('child_process');
    if (typeof clip_index === "string") {
        clip_index = parseInt(clip_index);
    }
    var file_to_play = mp3FilePath + get_all_mp3_sounds()[clip_index];
    console.log(file_to_play)
    switch (osType) {
        case "linux":
            player = Omx(file_to_play, "local", true, 1);
            break;
        case "win32":
            exec('fmedia.exe ' + file_to_play + " && timeout 5 && taskkill /im fmedia.exe");
            break;
    };
}
/**
 * 
 */
function activeSnoozeBtn() {
    // add to sittings some data to create snooze btn
    var settingsFile = jsonfile.readFileSync(settingsFilePath);
    // settingsFile["alarm_active"] = alarmInfos;
    console.log(settingsFile);
}

/**
 * //
 */
function killPlayer() {
    isRunning('fmedia.exe', 'omxplayer', 'omxplayer').then((v) => {
        console.log("Service is Running : " + v);
        if (v) {
            // change_settings_options({ alarm_active: 1 })
            console.log("prosess is running ... and killed now");
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
        }
    })

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
    var newSettingsObject = { ...exist_settings_file, ...option };
    jsonfile.writeFileSync(settingsFilePath, newSettingsObject);
}


function isRunning(win, mac, linux) {
    const exec = require('child_process').exec
    return new Promise(function (resolve, reject) {
        const plat = process.platform
        const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
        const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
        if (cmd === '' || proc === '') {
            resolve(false)
        }
        exec(cmd, function (err, stdout, stderr) {
            resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
        })
    })
}


/********************  HANDEL CONNECTION TO AI ***********************/
// connectToAIdevice();
let lastValue = 0;
let lastValueCounter = 0;
var timer = 100;
function connectToAIdevice() {
    const ip = "192.168.178.49";
    const portServer = 82;

    const request = http.request({
        port: portServer,
        host: ip,
        method: 'GET',
        path: '/g_d_s',
        timeout: 1000
    }, (res) => {
        //another chunk of data has been received, so append it to `str`
        res.on('data', function (chunk) {

            if (lastValue != parseFloat(chunk)) {

                console.log(parseFloat(chunk), lastValueCounter);
                if (lastValueCounter >= 5) {
                    console.log("hang up on value : ", lastValue);
                    lastValueCounter = 0;
                }

                lastValueCounter++;
            }
            timer = 100;
            lastValue = parseFloat(chunk);
        });

        //the whole response has been received, so we just print it out here
        res.on('end', function () { });
        res.on("error", (err) => { });
    });

    request.on("error", (err) => {
        console.log("error connectung ...", err)
        timer = 5000;
        request.destroy();
    });
    request.on("timeout", () => {
        console.log("timeout...");
        timer = 5000;
        request.destroy();
    });


    request.write("")
    request.end();

    setTimeout(connectToAIdevice, timer);
}


