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
let house_number_input = '05';
let floor_number_input;
let today              = 'Friday';
let current_time       = '10:00';
let offset_time        = '00:30'; // At least this much time should be available



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
        console.log(`Filter all → ${key}`);
        list_free_rooms(rooms, key);
    });
}


/**
 * Test if key matches the parameters for a specific building.
 * TODO: Add return type
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
            console.log(`Filter house: ${house} → ${key}`);
            list_free_rooms(rooms, key);
        }
    });
}


/**
 * Test if key matches the parameters for a specific building and floor.
 * TODO: Add return type
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
            console.log(`Filter house: ${house} & floor: ${floor} → ${key}`);
            list_free_rooms(rooms, key);
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
            `${time_current} is in Between ${time_begin} and ${time_end}`
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
function list_free_rooms(all_rooms, room, current_time) {
    let room_object = all_rooms[room];
    let lectures    = room_object.days[today];
    let now_time    = '13:30';
    
    // console.log(`current time is: ${now_time}`);
    
    lectures.forEach(lecture => {
        check_time_in_between(lecture.begin, lecture.end, now_time);
    });
    
    return lectures;
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
