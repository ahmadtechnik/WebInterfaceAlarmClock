var timePicker = null;
var time = null;
var listOfMp3Clips = null;
var intervals = {};





$(document).ready(() => {


    $.ajax("getMp3ClipsList", {
        type: "POST",
        success: (response) => {
            listOfMp3Clips = response;
            var clipsList = "";
            if (typeof listOfMp3Clips === "object") {
                listOfMp3Clips.forEach((elem, index) => {
                    clipsList += `<option value=${index} >${elem}</option>`;
                })
            }
            $(`#select_alarm_clip_basic`).append(clipsList);
        }
    })

    /**
     * 
     */
    timePicker = $(`#timepicker`).timepicker({
        timeFormat: 'HH:mm:ss',
        defaultTime: new Date(),
        dynamic: true,
        dropdown: false,
        scrollbar: true,
        change: (time_) => {
            time = time_;
        }
    });

    /**
     * 
     */
    $(document).on("click", "#add_to_alarms_list", () => {
        if (time) {
            var s_hours = new Date(time).getHours();
            var s_mins = new Date(time).getMinutes();
            var s_sec = new Date(time).getSeconds();
            var alarm_name = $(`#alarm_name`).val();
            $.ajax("addNewTimer", {
                async: true,
                type: "POST",
                data: {
                    alarm_data: s_hours.toString().padStart(2, 0) + ":" + s_mins.toString().padStart(2, 0) + ":" + s_sec.toString().padStart(2, 0),
                    alarm_date: time,
                    alarm_name: alarm_name,
                    alarm_selected_clip: $(`#select_alarm_clip_basic`).val()
                },
                success: (response) => {
                    console.log(response)
                }
            })
        } else {
            alert("Input is unfortunately empty.");
        }
        update_exist_alarms_table();
    });

    /**
     * assign on click of single alarm li 
     * to remove the alarm 
     */
    $(document).on("click", '.removeAlarmBrn', (event) => {
        var current_e = $(event.target).closest(".singleAlarmLi");
        var elemetn_index = current_e.attr("id");
        $.ajax("removeAlarm", {
            type: "POST",
            data: {
                index: parseInt(elemetn_index)
            },
            success: (response) => {
                update_exist_alarms_table();
            }
        })
    });

    /**
     * on change active of the alarm
     */
    $(document).on("change", '.changeAlarmStatus', (event) => {
        var current_e = $(event.target).closest(".singleAlarmLi");
        var elemetn_index = current_e.attr("id");
        var newValue = $(event.target).is(":checked") ? 1 : 0;
        $.ajax("disableEnableAlarm", {
            type: "POST",
            data: {
                e_index: elemetn_index,
                e_new_value: newValue
            },
            success: () => {

            }
        })
    });
    /**
     * 
     */
    $(document).on("focusout", `.alarm_notes`, (event) => {
        var current_e = $(event.target).closest(".singleAlarmLi");
        var elemetn_index = current_e.attr("id");
        $.ajax("addAlarmNote", {
            type: "post",
            data: {
                index: elemetn_index,
                content: encodeURI($(event.target).val())
            },
            success: () => {

            }
        })
    })
    /**
     * 
     */
    $(document).on("change", `#select_alarm_clip`, (event) => {
        var selected_clip_index = $(event.target).val();
        var current_e = $(event.target).closest(".singleAlarmLi");
        var elemetn_index = current_e.attr("id");
        $.ajax("changeAlarmMp3Clip", {
            type: "POST",
            data: {
                selected_index: selected_clip_index,
                selected_alarm: elemetn_index
            },
            success: (response) => {
                console.log(response)
            }
        })

    });

    $(document).on("click", '#stop_btn', () => {
        clearInterval(intervals.checkAlarmStatus);
        is_running = false;
        intervals.checkAlarmStatus = setInterval(checkIfPlayerIsRunning, 1000);
        $.ajax("disableEnableAlarm", {
            type: "POST",
            data: {
                onlyKill: true
            },
            success: (response) => {
                console.log(response)
            }
        })
    })
    $(document).on("click", '#snooze_btn', () => {
        clearInterval(intervals.checkAlarmStatus);
        is_running = false;
        intervals.checkAlarmStatus = setInterval(checkIfPlayerIsRunning, 1000);
        $.ajax("snoozeTimer", {
            type: "POST",
            data: {
                selected_period: parseInt($(`#snooze_time_field_input`).val())
            },
            success: (response) => {
                console.log(response)
            }
        })
    })

    update_exist_alarms_table();
    intervals.checkAlarmStatus = setInterval(checkIfPlayerIsRunning, 1000);

});


/**
 * feach existed alarms 
 */
function update_exist_alarms_table() {
    /**
     * 
     */
    $.getJSON("assets/alarms.json", (data) => {
        $(`#listOfAlarms`).html("");
        data.forEach((alarms, i) => {
            if (typeof alarms === "object") {
                var is_active = null;
                var alarm_name = "No Name";
                var notes = "";
                if (alarms.active === "yes" || alarms.active === 1) {
                    is_active = "checked";
                }
                if (alarms.alarm_name) {
                    alarm_name = decodeURI(alarms.alarm_name);
                }
                if (alarms.notes) {
                    notes = alarms.notes;
                }

                var c_0 = `<label class="container_check_box">Active 
                                <input type="checkbox" class='changeAlarmStatus' ${is_active}/> 
                                <span class="checkmark"></span>
                            </label>`;

                var clipsList = "";
                if (typeof listOfMp3Clips === "object") {
                    listOfMp3Clips.forEach((elem, index) => {
                        if (index === alarms.mp3_clip) {
                            clipsList += `<option value=${index} selected >${elem}</option>`;
                        } else {
                            clipsList += `<option value=${index} >${elem}</option>`;
                        }
                    })
                }

                var s_1 = `<select id='select_alarm_clip' class='select_clip_list'>${clipsList}</select>`;
                var c_2 = `<button class='removeAlarmBrn'>X</button>`;
                var a_1 = `<span class='alarm_name_text'>${alarm_name}</span>`;
                var n_1 = `<textarea rows='5' class='alarm_notes'>${decodeURI(notes)}</textarea>`;
                var e_1 = `<div class='alarm_in'>${alarms.alarm_in} ${c_2} </div>`;
                var e_2 = `<div class='options'>${c_0} ${n_1} ${a_1} ${s_1} </div>`;

                $(`#listOfAlarms`)
                    .append($(`<div class='singleAlarmLi' id='${i}' >`)
                        .append(e_1)
                        .append(e_2)
                    );
            }
        });
    });
};

/**
 * 
 */
var is_running = false;

function checkIfPlayerIsRunning() {
    clearInterval(intervals.checkAlarmStatus);
    $.ajax("/isAlarmRunning", {
        type: "post",
        data: {},
        success: (response) => {
            is_running = response;
        }
    });

    var snoozeBtnContainer = $(`#snoozeSection`);
    const stop_alarm_btn = $(`<button class="stop_btn" id='stop_btn'>Stope</button>`);
    const snooze_alarm_btn = $(`<button class="snooze_btn" id='snooze_btn'>Snooze</button>`);
    const snooze_timer_field = $(`<input type='number' value='20' class='snooze_time_field_input' id='snooze_time_field_input' />`);
    if (is_running) {
        snoozeBtnContainer.html($(`<div class='btns_container' id='btns_container'>`)
            .append([stop_alarm_btn, snooze_alarm_btn, snooze_timer_field]));
        intervals.checkAlarmStatus = setInterval(checkIfPlayerIsRunning, 1000 * 60);
    } else {
        snoozeBtnContainer.html("");
        intervals.checkAlarmStatus = setInterval(checkIfPlayerIsRunning, 1000);
    }
}