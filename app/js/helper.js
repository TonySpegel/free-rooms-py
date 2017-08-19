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
let building_number_input = '04';
let floor_number_input;
let today                 = 'Friday';
let current_time          = '10:00';
let offset_time           = '00:30'; // At least this much time should be available
let upper_time_limit      = '20:00';



window.onload = () => {
    fetch_calendar_week_json('14').then(result => {
        find_available_rooms(result);
    });
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
 * TODO: add return type
 * 
 * @param  {JSON} rooms
 * @return {TODO}
 */
function test_all(rooms) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        // console.log(`Filter all → ${key}`);
        // TODO: All values greater than 12 causes an error
        list_free_rooms(rooms, key, '12:00');
    });
}


/**
 * Test if key matches the parameters for a specific building.
 * TODO: Add return type
 * 
 * @param  {String} building_number
 * @param  {JSON} rooms
 * @return {TODO}
 */
function test_building_only(building_number, rooms) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        // Split these rooms in to single -> 04
        [building] = key.split('.');
        
        // If building is the same as the users input
        if (building === building_number) {
            console.log(`Building only: ${building} → ${key}`);
            list_free_rooms(rooms, key, '15:00');
        }
    });
}


/**
 * Test if key matches the parameters for a specific building and floor.
 * TODO: Add return type
 * 
 * @param  {String} building_number
 * @param  {String} floor_number
 * @param  {JSON}   rooms
 * @return {TODO}
 */
function test_building_and_floor(building_number, floor_number, rooms) {
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
            list_free_rooms(rooms, key, '11:00');
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
function check_time_in_between(time_begin, time_end, time_current) {
    [begin_hours, begin_minutes]     = time_begin.split(':');
    [end_hours, end_minutes]         = time_end.split(':');
    [current_hours, current_minutes] = time_current.split(':');
    begin_minutes_combined           = begin_hours * 60 + begin_minutes;
    end_minutes_combined             = end_hours * 60 + end_minutes;
    current_minutes_combined         = current_hours * 60 + current_minutes;

    // Requested time is in between a lecture
    if (
        current_minutes_combined >= begin_minutes_combined && 
        current_minutes_combined < end_minutes_combined
    ) {
        console.log(
            `${time_current} is in between ${time_begin} and ${time_end}`
        );
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
function list_free_rooms(all_rooms, room, time_param) {
    let room_object     = all_rooms[room];
    let lectures        = room_object.days[today];
    let lectures_number = lectures.length;
    let now_time        = time_param;
    let between         = false; 
    let free_room_flag  = false; 
    
    lectures.forEach((lecture, index) => {
        between      = check_time_in_between(lecture.begin, lecture.end, now_time);
        current_time = parseTime(now_time);
        
        if (between) {
            end_time         = parseTime(lectures[index].end);
            upper_time_limit = parseTime('20:00');
            available_in     = end_time - current_time;
            
            // Last lecture for this day
            if (index + 1 === lectures_number) {
                console.log(
                    '%cLast lecture!', 
                    'color: #f44336; text-decoration: underline;'
                );
                
                available_time   = upper_time_limit - end_time;
                
                console.log(
                    `%cRoom available in ${available_in} Minutes ⏱ for ${available_time} Minutes
                    `,
                    'color: #4caf50'
                );
                
                return false;
            }
            
            let next_lecture   = index + 1;
            begin_next_lecture = parseTime(lectures[next_lecture].begin);
            available_time     = begin_next_lecture - end_time;
            
            console.log(
                `%cRoom available in ${available_in} Minutes ⏱ for ${available_time} Minutes
                `,
                'color: #4caf50'
            );
        }
        
        begin_time = parseTime(lectures[index].begin);

        if (free_room_flag === false) {
            if (current_time <= begin_time) {
                free_room_flag = index;
                
                console.log(`Room is free for ${begin_time - current_time} Minutes`);
                console.log(`${lectures[index].begin} - ${lectures[index].end}`);
            }
            
            if (current_time >= begin_time) {
                if (index + 1 === lectures_number) {
                    console.log(
                        '%cLast lecture!', 
                        'color: #f44336; text-decoration: underline;'
                    );
                    
                    available_time = parseTime(upper_time_limit) - parseTime(now_time);
                    console.log(
                        `Room is available for the rest of the day (${available_time} Minutes)`
                    );
                    
                    console.log(upper_time_limit);
                    
                }

            }
        }
    });
    return lectures;
}


/**
 * Calls different functions depending on set_test_state return value
 * 
 * @param  {JSON} rooms
 */
function find_available_rooms(rooms) {
    switch(set_test_state(building_number_input, floor_number_input)) {
        case 0:
            test_all(rooms);
            break;
        case 1:
            test_building_only(building_number_input, rooms);
            break;
        case 2:
            test_building_and_floor(
                building_number_input, floor_number_input, rooms
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
 * @return {Integer}            -> 720
 */
function parseTime(time_string) {
   [hours, minutes] = time_string.split(':');
   let rel = parseInt(hours * 60) + parseInt(minutes); 
   return rel;
}
