/**
 * © 2017-08 Tony Spegel
 * 
 * Free Rooms EAH-Jena
 * 
 * Contributors:
 * Tony Spegel
 */

// Test-presets
// TODO: implement offset_time
var building_number_input; 
var floor_number_input;
let today            = 'Monday'; 
let offset_time      = '00:30';  // At least this much time should be available
let upper_time_limit = '20:00';
let calendar_week    = '43';
let free_room_flag   = false; 
let debug_flag       = false;    // Used to show console.log();
let free_rooms       = [];
let occupied_rooms   = [];
let all_rooms_list   = [];       // Includes free_rooms_sorted & occupied_rooms_sorted
let all_rooms_html   = '';

// times used to test against JSON-data
let times = [
    '09:15',
    '11:30',
    '13:00',
    '15:15'
];

const BG_COLOR = [
    'color--cloudy-knoxville',
    'color--eternal-constance',
    'color--frost',
    'color--heavy-rain',
    'color--midnight-bloom',
    'color--mirage',
    'color--nighthawk',
    'color--royal',
    'color--vicious-stance',
];

let querySel = document.querySelector.bind(document);

Date.prototype.getWeekNumber = function(){
    var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

window.onload = () => {
    let bg_class = BG_COLOR[pickRandomNumber(0, BG_COLOR.length - 1)];
    document.querySelector('body').classList.add(bg_class);

    const BTN_MENU_OPENER     = querySel('#btn-menu-opener');
    const BTN_MENU_CLOSE      = querySel('#btn-menu-close');
    const SWITCH_CURRENT_TIME = querySel('#switch-current-time');

    querySel('#building').addEventListener('change', () => {
        let sel = querySel('#building');
        select_handler(sel);
    });

    SWITCH_CURRENT_TIME.addEventListener('click', e => {
        let input_week_wrapper = querySel('#input-week')
        let input_week_input   = querySel('#input-week .mdl-textfield__input');
        let current_time_input = querySel('#current-time-input .mdl-textfield__input');
        let select_day_wrapper = querySel('#select-day-wrapper');
        let select_day         = querySel('#select-day');
        let notification_box   = querySel('#cg-notification-area');
        let checked            = e.target.checked;

        notification_box.classList.toggle('--current-time');
        input_week_wrapper.classList.toggle('is-disabled');
        select_day_wrapper.classList.toggle('is-disabled');

        if (checked) {
            input_week_input.disabled   = true;
            current_time_input.disabled = true;
            select_day.disabled         = true;
        }
        else {
            input_week_input.disabled   = false;
            current_time_input.disabled = false;
            select_day.disabled         = false;
        }
    });

    BTN_MENU_OPENER.addEventListener('click', (e) => {
        let btn_element_mode = e.currentTarget.dataset.mode;
        handle_menu();

        if (btn_element_mode === 'open') {
            e.currentTarget.dataset.mode = 'filter';
            console.log(btn_element_mode);
        
            return false;
        }

        e.currentTarget.dataset.mode = 'open';

        handle_search();
    });

    BTN_MENU_CLOSE.addEventListener('click', (e) => {
        handle_menu();
        BTN_MENU_OPENER.dataset.mode = 'open';
    });

    new Clipboard('.tsp-btn-copy');
};

function handle_menu() {
    let area = document.querySelector('#cg-notification-area');
    area.classList.toggle('notification-area--expanded');
}

function handle_search() {
    const selected_building   = document.querySelector('#building').dataset.val;
    const selected_floor      = document.querySelector('#floor').dataset.val;
    const MAIN_WRAPPER        = document.querySelector('#target');
    const current_week_number = new Date().getWeekNumber().toString();
    let current_time

    const CURRENT_TIME_SWITCH = document.querySelector('#switch-current-time');
    const CURRENT_TIME_INPUT  = document.querySelector('#current-time-input');
    
    if (CURRENT_TIME_SWITCH.checked) {
        mins = ('0' + new Date().getMinutes()).slice(-2);
        current_time = `${new Date().getHours()}:${mins}`;
    }
    else {
        current_time = CURRENT_TIME_INPUT.MaterialTextfield.element_.MaterialTextfield.input_.value;
    }

    building_number_input     = selected_building === 'all' ? undefined : selected_building;
    floor_number_input        = selected_floor === 'all' ? undefined : selected_floor;
    
    console.log(building_number_input);
    console.log(floor_number_input);
    fetch_calendar_week_json(current_week_number).then(result => {
        console.log(current_time, 'hihi');
        find_available_rooms(result, current_time);
        
        let free_rooms_sorted = free_rooms.sort((x, y) => {
            return y.available_for - x.available_for;
        });
        
        let occupied_rooms_sorted = sort_by_multiple_keys(
            occupied_rooms,
            'available_in',
            'available_for'
        );

        // Combine free and occupied rooms
        all_rooms_list = [
            ...free_rooms_sorted,
            ...occupied_rooms_sorted
        ];
        
        if (debug_flag) {
            console.table(all_rooms_list);
        }
        
        all_rooms_list.forEach(entry => {
            all_rooms_html += create_room_html(
                entry.free,
                entry.room,
                entry.building,
                entry.floor,
                entry.room_nr,
                entry.summary,
                entry.display_text,
                entry.room_id
            );
        });

        MAIN_WRAPPER.innerHTML = '';
        
        MAIN_WRAPPER.insertAdjacentHTML(
            'beforeend', all_rooms_html
        );

        free_rooms     = [];
        occupied_rooms = [];
        all_rooms_html = '';  
    });
}

function build_floor_select_list(floors = [], target_element) {
    let select_items = '';
    let target       = document.querySelector(target_element)
    
    floors.forEach(floor => {
        select_items = select_items + `<li class="mdl-menu__item" data-val="${floor}">${floor}</li>`
    });

    target.innerHTML = '';

    target.insertAdjacentHTML(
        'beforeend',
        select_items
    );

    document.querySelector('#floor').dataset.val = 'all';
    getmdlSelect.init('.flr');
    document.querySelector('#floor-list-wrapper li').click();
}

function select_handler(selected_item) {
    let selected_item_value = selected_item.dataset.val;
    let floor_list_elements = [];
    const floor_list_html = document.querySelector('.flr');
    
    floor_list_html.classList.add('--visible');
    
    switch(selected_item_value) {
        case 'all':
            floor_list_html.classList.remove('--visible');
            floor_number_input = undefined;
            floor_list_elements = [];
            floor_list_elements = [...['all']];

            build_floor_select_list(floor_list_elements, '#floor-list-wrapper');
            break;
        case '01':
            floor_list_elements = [];
            floor_list_elements = [...['all', '01', '02', '03']];

            build_floor_select_list(floor_list_elements, '#floor-list-wrapper');
            break;
        case '02':
            floor_list_elements = [];
            floor_list_elements = [...['all', '02', '03']];

            build_floor_select_list(floor_list_elements, '#floor-list-wrapper');
            break;
        case '03':
        case '04':
        case '05':
            floor_list_elements = [];
            floor_list_elements = [...['all', '-1', '00', '01', '02', '03']];
            
            build_floor_select_list(floor_list_elements, '#floor-list-wrapper');
            break;
    }

    return selected_item_value;
}


/**
 * Retrieves a JSON representing a calendar-week including 
 * all rooms and their timetables
 * 
 * @param  {String|JSON} cw     Part of a file-string
 * @return {JSON}               A JSON including all rooms and their timetables 
 *                              for one specific calendar-week
 */
async function fetch_calendar_week_json(cw) {
    let path   = document.URL.includes('github') ? 'app/' : '';

    let response      = await fetch(`../${path}json/42.json`);
    let response_json = await response.json();
    return response_json;
}


/**
 * Depending on how many params are set, a different state will be returned.
 * It is used to call different functions. 
 * 
 * 0 = All buildings, every floor
 * 1 = Specific building, every floor
 * 2 = Specific building, specific floor
 * 
 * @param {String} [building=undefined] '05'
 * @param {String} [floor=undefined] '00'
 */
function set_test_state(building = undefined, floor = undefined) {
    if (building === undefined && floor === undefined) return 0;
    if (building !== undefined && floor === undefined) return 1;
    if (building !== undefined && floor !== undefined) return 2;
}


/**
 * Test if key matches the parameters all rooms which passes every time
 * 
 * @param  {JSON} rooms
 */
function test_all(rooms, time) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        list_free_rooms(rooms, key, time, rooms[key].id);
    });
}


/**
 * Test if key matches the parameters for a specific building.
 * 
 * @param  {String} building_number
 * @param  {JSON} rooms
 */
function test_building_only(building_number, rooms, time) {
    // Get every room out of -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        // Split these rooms in to single -> 04
        [building] = key.split('.');
        
        // If building is the same as the users input
        if (building === building_number) {
            if (debug_flag) {
                console.log(`Building only: ${building} → ${key}`);
            }

            list_free_rooms(rooms, key, time);
        }
    });
}


/**
 * Test if key matches the parameters for a specific building and floor.
 * 
 * @param  {String} building_number
 * @param  {String} floor_number
 * @param  {JSON}   rooms
 */
function test_building_and_floor(building_number, floor_number, rooms, time) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        [building, floor] = key.split('.');
        
        // If both building and floor are the same as the users input
        if (building === building_number && floor === floor_number) {
            if (debug_flag) {
                console.log(
                    `Building: ${building} & floor: ${floor} → ${key}
                    `
                );
            }
            list_free_rooms(rooms, key, time);
        }
    });
}


/**
 * Checks if a given time is in between a lectures beginning and its end.
 * This is achieved by converting these times in two minutes.
 * 
 * @param  {String}     time_begin   09:30
 * @param  {String}     time_end     11:00
 * @param  {String}     time_current 10:15
 * @return {Boolean}                 If a time is between begin and end
 */
function check_time_in_between(lecture_begin, lecture_end, current_time) {
    lecture_begin_minutes = parse_time_to_minutes(lecture_begin);
    lecture_end_minutes   = parse_time_to_minutes(lecture_end);
    current_time_minutes  = parse_time_to_minutes(current_time);

    // Requested time is in between a lecture
    if (
        current_time_minutes >= lecture_begin_minutes  && 
        current_time_minutes < lecture_end_minutes
    ) {
        if (debug_flag) {
            console.log(
                `${current_time} is in between ${lecture_begin} and ${lecture_end}`
            );
        }
        
        return true;
    }
}


/**
 * TODO: Add description and types
 * 
 * @param  {[type]} all_rooms    [description]
 * @param  {[type]} room         [description]
 * @param  {[type]} current_time [description]
 * @return {[type]}              [description]
 */
function list_free_rooms(all_rooms, room, time_param, room_id) {
    let room_object            = all_rooms[room];
    let lectures               = room_object.days[today];
    let display_text           = `No lectures today`;
    [building, floor, room_nr] = split_room_string(room);
    
    // No lectures this day
    if (lectures === undefined) {
        if (debug_flag) {
            console.log(
                `%c${display_text}`,
                `color: #4caf50; 
                background-color: black; 
                font-size: 15pt; 
                padding: 3pt`
            );
        }
        
        free_rooms.push({
            'free'    : true,
            room,
            building,
            floor,
            room_nr,
            'minutes' : undefined,
            display_text,
            'room_id' : undefined,
            'available_for' : Infinity
        });
        
        return false;
    }
    
    let lectures_number = lectures.length;
    let now_time        = time_param;
    let between         = false; 
    let minutes;
    
    // Iterate over every lecture on a given day for a specific room
    lectures.forEach((lecture, index) => {
        between          = check_time_in_between(lecture.begin, lecture.end, now_time);
        current_time     = parse_time_to_minutes(now_time);
        upper_time_limit = parse_time_to_minutes('20:00');
        
        if (between) {
            end_time     = parse_time_to_minutes(lectures[index].end);
            available_in = minutes_to_hours(end_time - current_time);
            last_lecture = index + 1 === lectures_number;
            
            // Last lecture for this day
            if (last_lecture) {
                if (debug_flag) {
                    console.log(
                        '%cLast lecture!', 
                        'color: #f44336; text-decoration: underline;'
                    );
                }
                
                minutes = upper_time_limit - end_time;
                available_time = minutes_to_hours(minutes);
                
                if (debug_flag) {
                    console.log(
                        `%c${room} available in ${available_in} ⏱ for the rest of the day`,
                        `color: #FF9800; 
                        background-color: black;
                        font-size: 15pt; 
                        padding: 3pt`
                    );
                    
                    console.log(lecture.summary);
                    console.log('');
                }
                
                occupied_rooms.push({
                    'free'          : false,
                    room,
                    building,
                    floor,
                    room_nr,
                    'available_in'  : end_time - current_time,
                    'available_for' : Infinity,
                    'summary'       : lecture.summary,
                    'display_text'  : `Available in ${available_in} for the rest of the day`,
                    room_id
                });
                
                
                return false;
            }
            
            let next_lecture   = index + 1;
            begin_next_lecture = parse_time_to_minutes(lectures[next_lecture].begin);
            minutes            = begin_next_lecture - end_time;
            available_time     = minutes_to_hours(minutes);
            display_text       = `Available in ${available_in} for ${available_time}`;
            if (debug_flag) {
                console.log(
                    `%${display_text}`,
                    'color: #FF9800; background-color: black; black; font-size: 15pt; padding: 3pt'
                );
                console.log(lecture.summary);
            }
            
            occupied_rooms.push({
                'free'          : false,
                room,
                building,
                floor,
                room_nr,
                'available_in'  : end_time - current_time,
                'available_for' : minutes,
                'summary'       : lecture.summary,
                display_text,
                room_id
            });
            
            free_room_flag = true;
            
            return false;
        }
        
        // "Else"
        begin_time = parse_time_to_minutes(lectures[index].begin);

        if (free_room_flag === false) {
            if (current_time <= begin_time) {
                free_room_flag     = true;
                minutes            = begin_time - current_time;
                let available_time = minutes_to_hours(minutes);
                display_text       = `Available for ${available_time}`;

                if (debug_flag) {
                    console.log(
                        `%c${room} is free for ${available_time}`,
                        `color: #4caf50; 
                        background-color: black; 
                        font-size: 15pt; 
                        padding: 3pt`
                    );
                }
                
                free_rooms.push({
                    'free'          : true,
                    room,
                    building,
                    floor,
                    room_nr,
                    'available_for' : minutes,
                    display_text,
                    room_id
                });
                
                return false;
            } 

            // Else - Available for the rest of the day
            if (index + 1 === lectures_number) {
                if (debug_flag) console.log('letzte Vorlesung - danach');
                minutes        = upper_time_limit - current_time;
                available_time = minutes_to_hours(minutes);
                display_text   = `Available for the rest of the day`;
            
                if (debug_flag) {
                    console.log(
                        `%c${display_text}`,
                        `color: #4caf50; 
                        background-color: black; 
                        font-size: 15pt; 
                        padding: 3pt`
                    );
                }
                
                free_rooms.push({
                    'free'          : true,
                    room,
                    building,
                    floor,
                    room_nr,
                    'available_for' : minutes,
                    display_text
                });
            }
        }
    });
    
    free_room_flag = false;
    return lectures;
}


/**
 * Calls different functions depending on set_test_state return value
 * 
 * @param  {JSON} rooms
 */
function find_available_rooms(rooms, time) {
    switch(set_test_state(building_number_input, floor_number_input)) {
        case 0:
            test_all(rooms, time);
            break;
        case 1:
            test_building_only(building_number_input, rooms, time);
            break;
        case 2:
            test_building_and_floor(
                building_number_input, floor_number_input, rooms, time
            );
            break;
        default:
    }
}


/**
 * Returns the current time
 * 
 * @return {String|Time} -> e. g. 22:49
 */
function get_current_time() {
    let date    = new Date();
    let hours   = date.getHours();
    let minutes = date.getMinutes();
    
    return `${hours}:${minutes}`;
}


/**
 * Parses time string into a hours and minutes variable
 * 
 * @param  {String} time_string -> 12:00
 * @return {Number}            -> 720
 */
function parse_time_to_minutes(time_string) {
    [hours, minutes] = time_string.split(':');
    let rel = parseInt(hours * 60) + parseInt(minutes); 
    return rel;
}


/**
 * Receives minutes and converts it to hours and minutes 
 * and returns it as a String. It also decides if the plural 
 * of minute or hour should be used.
 *  
 * @param  {Number} minutes
 * @return {String}
 */
function minutes_to_hours(minutes) {
    let plural_minutes;
    
    if (minutes > 60) {
        let hours          = Math.floor( minutes / 60);
        minutes            = minutes % 60;
        let plural_hours   = hours === 1 ? '' : 's'; 
        plural_minutes     = minutes === 1 ? '' : 's'; 
        let minutes_string = '';
        
        if (minutes > 0) {
            minutes_string = ` & ${minutes} Minute${plural_minutes}`;
        }
        
        return `${hours} Hour${plural_hours}${minutes_string}`;
    }
    
    plural_minutes = minutes === 1 ? '' : 's'; 
    
    return minutes === 60 ? '1 Hour' : `${minutes} Minute${plural_minutes}`;
}

/**
 * Takes an Array which hold n-Objects which can be sorted by two keys at once.
 * It's possible to choose the sorting-order of each key independently.
 * 
 * This function is used for rooms which aren't available and it's therefore
 * more practial to list rooms that are available 
 * earlier and longer than others first.
 *
 * {available_in: 10, available_for: 30}
 * {available_in: 20, available_for: 15}
 * {available_in: 20, available_for: 10}
 * 
 * @param  {Array|Object}           unsorted_array
 * @param  {Object.property|String} first_key      // 1st key to sort 
 * @param  {Object.property|String} second_key     // 2nd key to sort 
 * @param  {Boolean}                [first_key_order_asc=true]
 * @param  {Boolean}                [second_key_order_asc=false] 
 * @return {Array|Object}           // A sorted Array
 */
function sort_by_multiple_keys(
    unsorted_array, 
    first_key, 
    second_key,
    first_key_order_asc = true,
    second_key_order_asc = false
) {
    return unsorted_array.sort((x, y) => {
        let n = first_key_order_asc ? 
            x[first_key] - y[first_key]:
            y[first_key] - x[first_key];
        
        if (n !== 0) {
            return n;
        }
        
        return second_key_order_asc ?
            x[second_key] - y[second_key]:
            y[second_key] - x[second_key]; 
    });
}

/**
 * Returns and index of a given pattern after its n-th occurrence.
 * 
 * @param  {String} str
 * @param  {String} pattern
 * @param  {Number} nth_occurrence
 * 
 * @return {Index}
 */
function nth_index(str, pattern, nth_occurrence){
    const STR_LENGTH = str.length;
    let i = -1;
        
    while(nth_occurrence-- && i++< STR_LENGTH){
        i= str.indexOf(pattern, i);
        if (i < 0) break;
    }
    return i;
}

/**
 * room_str can contain more than two dots, which shouldn't be split.
 * Therefore another function (nth_index) is used, which splits only 
 * the first two occurrences of a dot.
 * 
 * @param  {String} room_str
 * @return {Array|String}
 */
function split_room_string(room_str) {
    [building, floor] = room_str.split('.');
    let room_nr_index = nth_index(room_str, '.', 2) + 1;
    let room_nr       = room_str.slice(room_nr_index, room_str.length);
    
    return [building, floor, room_nr];
}


/**
 * Picks a random number
 *
 * @param {Integer} min [lower limit]
 * @param {Integer} max [upper limit]
 */
function pickRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}