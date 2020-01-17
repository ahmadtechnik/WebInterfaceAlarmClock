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
            $.ajax("addNewTimer", {
                async: true,
                type: "POST",
                data: {
                    alarm_data: s_hours + ":" + s_mins + ":" + s_sec,
                    alarm_date: time
                },
                success: (response) => {
                    console.log(response)
                }
            })
        }
        update_exist_alarms_table();
    });

    /**
     * assign on click of single alarm li 
     * to remove the alarm 
     */
    $(document).on("click", '.alarm_in', (event) => {
        if (event.ctrlKey) {
            var current_e = $(event.target).closest("li");
            var elemetn_index = current_e.attr("id");
            $.ajax("removeAlarm", {
                type: "POST",
                data: {
                    index: elemetn_index
                },
                success: (response) => {
                    update_exist_alarms_table();
                }
            })
        }
    });

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

                if (alarms.active === "yes" || alarms.active === 1) {
                    is_active = "checked";
                }

                var c_1 = `<label>Active : <input type='checkbox' class='changeAlarmStatus' ${is_active} /></label>`
                var c_2 = ``;
                var e_1 = `<div class='alarm_in'>${alarms.alarm_in}</div>`;
                var e_2 = `<div class='options'>${c_1 }<br>${c_2}</div>`;

                $(`#listOfAlarms`)
                    .append($(`<li class='singleAlarmLi' id='${i}' >`)
                        .append(e_1)
                        .append(e_2)
                    );
            }
        });
    });
}