let house_number_input = '05';
let floor_number_input = '02';
let today              = 'Friday';
let current_time       = '10:00';
let offset_time        = '00:30';



window.onload = () => {
    fetch_calendar_week_json('14').then(result => {
        find_available_rooms(result);
    });

    console.log(get_current_time());
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
    let response = await fetch(`./json/${cw}.json`);
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
 * @param {String} [house=undefined] '05'
 * @param {String} [floor=undefined] '00'
 */
function set_test_state(house = undefined, floor = undefined) {
    if (house === undefined && floor === undefined) return 0;
    if (house !== undefined && floor === undefined) return 1;
    if (house !== undefined && floor !== undefined) return 2;
}


/**
 * Test if key matches the parameters for a specific building.
 * 
 * @param  {String} house_number
 * @param  {JSON} rooms
 * @return {TODO}
 */
function test_house_only(house_number, rooms) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        // Split these rooms in to single -> 04
        [house] = key.split('.');
        
        // If house is the same as the users input
        if (house === house_number) {
            console.log(`gefunden ${key}`);
            console.log(list_free_rooms(rooms, key));
        }
    });
}


function check_time(time_begin, time_end, time_current) {
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
        console.log('In Between');
        return true;
    }
}

function list_free_rooms(all_rooms, room, current_time) {
    let room_object = all_rooms[room];
    let lectures    = room_object.days[today];
    let now_time    = '09:15';
    
    console.log(`current time is: ${now_time}`);
    
    lectures.forEach(lecture => {
        check_time(lecture.begin, lecture.end, now_time);
    });
    
    return lectures;
}


/**
 * Test if key matches the parameters for a specific building and floor.
 * 
 * @param  {String} house_number
 * @param  {String} floor_number
 * @param  {JSON}   rooms
 * @return {TODO}
 */
function test_house_and_floor(house_number, floor_number, rooms) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        [house, floor] = key.split('.');
        
        // If both house and floor are the same as the users input
        if (house === house_number && floor === floor_number) {
            console.log(`gefunden ${key}`);
            list_free_rooms(rooms, key);
        }
    });
}

/**
 * Test if key matches the parameters all rooms which passes every time
 * 
 * @param  {JSON} rooms
 * @return {TODO}
 */
function test_all(rooms) {
    // Get every room ot ouf -> 04.-1.17(SimLab)
    let rooms_top_level_keys = Object.keys(rooms);
    
    // Iterate through each of this rooms
    rooms_top_level_keys.forEach(key => {
        console.log(`gefunden ${key}`);
    });
}


/**
 * Calls different functions depending on set_test_state return value
 * 
 * @param  {JSON} rooms
 */
function find_available_rooms(rooms) {
    switch(set_test_state(house_number_input, floor_number_input)) {
        case 0:
            test_all(rooms);
            break;
        case 1:
            test_house_only(house_number_input, rooms);
            break;
        case 2:
            test_house_and_floor(house_number_input, floor_number_input, rooms);
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
