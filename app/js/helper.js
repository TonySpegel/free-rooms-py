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
let building_number_input;
let floor_number_input;
let today            = 'Friday'; 
let offset_time      = '00:30';  // At least this much time should be available
let upper_time_limit = '20:00';
let calendar_week    = '14';
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

window.onload = () => {
    const MAIN_WRAPPER = document.querySelector('#target'); 
    fetch_calendar_week_json(calendar_week).then(result => {
        times.forEach(time => {
            console.log(
                `%cTEST: ${time}`,
                'background-color: #109; color: #9e9e9e; font-size: 15pt; padding: 3pt'
            );
            
            MAIN_WRAPPER.insertAdjacentHTML(
                'beforeend', 
                `<div class="tsp-card--info">
                    Test: ${today}, Week: ${calendar_week}, ${time}
                </div>`
            );
            
            find_available_rooms(result, time);
            
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
            
            console.table(all_rooms_list);
            
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
            
            MAIN_WRAPPER.insertAdjacentHTML(
                'beforeend', all_rooms_html
            );

            free_rooms     = [];
            occupied_rooms = [];
            all_rooms_html = '';
        });
    });

    new Clipboard('.tsp-btn-copy');
};


/**
 * Retrieves a JSON representing a calendar-week including 
 * all rooms and their timetables
 * 
 * @param  {String|JSON} cw     Part of a file-string
 * @return {JSON}               A JSON including all rooms and their timetables 
 *                              for one specific calendar-week
 */
async function fetch_calendar_week_json(cw) {
    let response      = await fetch(`./json/${cw}.json`);
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
            console.log(`Building only: ${building} → ${key}`);
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
            console.log(
                `Building: ${building} & floor: ${floor} → ${key}
                `
            );
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
    let display_text           = `${room} is available (no lectures today)`;
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
            'room_id' : undefined
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
                    'display_text'  : `Available in ${available_in} (rest of the day)`,
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
