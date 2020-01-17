var timePicker = null;
var time = null;
$(document).ready(() => {
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
            console.log(alarm_name)
            $.ajax("addNewTimer", {
                async: true,
                type: "POST",
                data: {
                    alarm_data: s_hours + ":" + s_mins + ":" + s_sec,
                    alarm_date: time,
                    alarm_name: alarm_name
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

    update_exist_alarms_table();

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

                var c_1 = `<label>Active : </label><input type='checkbox' class='changeAlarmStatus'  />`
                var c_2 = `<button class='removeAlarmBrn'>X</button>`;
                var a_1 = `<span class='alarm_name_text'>${alarm_name}</span>`;
                var n_1 = `<textarea rows='5' class='alarm_notes'>${decodeURI(notes)}</textarea>`;
                var e_1 = `<div class='alarm_in'>${alarms.alarm_in} ${c_2} </div>`;
                var e_2 = `<div class='options'>${c_0} ${n_1} ${a_1} </div>`;
                $(`#listOfAlarms`)
                    .append($(`<div class='singleAlarmLi' id='${i}' >`)
                        .append(e_1)
                        .append(e_2)
                    );
            }
        });
    });
};