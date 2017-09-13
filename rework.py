import urllib.request                   # Request website-data
from bs4 import BeautifulSoup           # Parse website-data
import json                             # Handle JSON files
import os                               # For OS-level operations
import errno                            # Catch errors
from icalendar import Calendar          # parser/generator of iCalendar files
import pprint

room_links = []

# Link is used as a template to download ics-files
ICS_BASE_LINK = 'http://stundenplanung.eah-jena.de/ical/raum/?id='

# Link which represents the entry-point to download every calendar-file
EAH_ROOMS_BASE_URL = "http://stundenplanung.eah-jena.de/raeume/"

WEEK_INDEX = 0
DATE_INDEX = 1
DAY_INDEX = 2
BEGIN_INDEX = 3
END_INDEX = 4
ROOM_NAME_INDEX = 5
SUMMARY_INDEX = 6


def digest_room_website():
    eah_rooms_website = urllib.request.urlopen(EAH_ROOMS_BASE_URL)
    eah_rooms_website_soup = BeautifulSoup(eah_rooms_website, "lxml")
    eah_rooms_options_list = eah_rooms_website_soup.select('select[id=id] > option')

    ics_list = []

    # Select drop down and add its elements to a list
    for option in eah_rooms_options_list:
        option_value = option['value']  # SPLUSA8CFB5 - a rooms ID

        # Test if first char is a digit do exclude rooms such as:
        if option.text[0].isdigit():
            option_text = option.text  # 05.00.03

            # Build download-link using ICS_BASE_LINK and option_value
            ics_link = '{}{}'.format(ICS_BASE_LINK, option_value)

            ics_list.append([option_value, option_text, ics_link])

    return ics_list


def parse_ics_data(ics_data):
    extracted_info = []
    extracted_info_sorted = []

    i = 0

    for ics in ics_data:
        room_id = ics[0]
        room_name = ics[1]
        ics_url = ics[2]

        i = i + 1

        print('Downloading {} {}/{}'.format(room_id, i, len(ics_data)))

        with urllib.request.urlopen(ics_url) as response:
            ics_response = Calendar.from_ical(response.read())

            for component in ics_response.walk():
                if component.name == "VEVENT":
                    summary = component.get('summary')
                    start_time = component.get('dtstart').dt
                    end_time = component.get('dtend').dt
                    calendar_week = start_time.isocalendar()[1]

                    extracted_info.append([
                        calendar_week,
                        start_time.strftime('%Y%m%d'),
                        start_time.strftime('%A'),
                        start_time.strftime('%H:%M'),
                        end_time.strftime('%H:%M'),
                        room_name,
                        'summary text'
                    ])

                    sort = sorted(
                        extracted_info,
                        key=lambda x: (x[WEEK_INDEX], x[DATE_INDEX], x[BEGIN_INDEX])
                    )
    # TODO: Habe das von append zu einer Zuweiung geändert
    extracted_info_sorted = sort

    return extracted_info_sorted


room_list = [
    ['SPLUSB70893', '01.-1.13(SZB)', 'http://stundenplanung.eah-jena.de/ical/raum/?id=SPLUSB70893'],
    ['SPLUSDE238B', '04.00.15/FT', 'http://stundenplanung.eah-jena.de/ical/raum/?id=SPLUSDE238B']
]

parsed_data = [
    [15, '20170413', 'Thursday', '13:30', '16:30', '04.00.15/FT', 'lit text'],
    [16, '20170419', 'Wednesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [17, '20170427', 'Thursday', '13:30', '16:30', '04.00.15/FT', 'mofo text'],
    [17, '20170428', 'Friday', '09:30', '12:30', '04.00.15/FT', 'summary text'],
    [18, '20170503', 'Wednesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [19, '20170511', 'Thursday', '13:30', '16:30', '04.00.15/FT', 'summary text'],
    [19, '20170512', 'Friday', '09:30', '12:30', '04.00.15/FT', 'super lit text'],
    [20, '20170515', 'Monday', '08:00', '12:00', '01.-1.13(SZB)', 'lit af text'],
    [20, '20170515', 'Monday', '15:15', '18:15', '04.00.15/FT', 'summary text'],
    [20, '20170516', 'Tuesday', '15:15', '17:15', '01.-1.13(SZB)', 'summary text'],
    [20, '20170517', 'Wednesday', '08:00', '11:00', '01.-1.13(SZB)', 'yo text'],
    [20, '20170517', 'Wednesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [20, '20170517', 'Wednesday', '13:30', '16:30', '04.00.15/FT', 'summary text'],
    [20, '20170519', 'Friday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [21, '20170522', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [21, '20170522', 'Monday', '12:00', '15:00', '04.00.15/FT', 'summary text'],
    [22, '20170529', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [22, '20170531', 'Wednesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [22, '20170531', 'Wednesday', '15:15', '18:15', '04.00.15/FT', 'summary text'],
    [22, '20170601', 'Thursday', '08:00', '11:00', '04.00.15/FT', 'yo digger text'],
    [22, '20170602', 'Friday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [23, '20170608', 'Thursday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [24, '20170612', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [24, '20170612', 'Monday', '15:15', '18:15', '01.-1.13(SZB)', 'summary text'],
    [24, '20170613', 'Tuesday', '08:00', '11:00', '01.-1.13(SZB)', 'summary text'],
    [24, '20170613', 'Tuesday', '15:15', '18:15', '04.00.15/FT', 'summary text'],
    [24, '20170614', 'Wednesday', '08:00', '11:00', '01.-1.13(SZB)', 'summary text'],
    [24, '20170614', 'Wednesday', '15:15', '18:15', '04.00.15/FT', 'summary text'],
    [24, '20170615', 'Thursday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [25, '20170619', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [25, '20170619', 'Monday', '12:00', '15:00', '04.00.15/FT', 'summary text'],
    [25, '20170620', 'Tuesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [25, '20170621', 'Wednesday', '13:30', '16:30', '04.00.15/FT', 'summary text'],
    [25, '20170622', 'Thursday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [26, '20170626', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [26, '20170627', 'Tuesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [26, '20170628', 'Wednesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [26, '20170628', 'Wednesday', '15:15', '18:15', '04.00.15/FT', 'summary text'],
    [26, '20170629', 'Thursday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [27, '20170703', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [27, '20170704', 'Tuesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [28, '20170710', 'Monday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [28, '20170711', 'Tuesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [28, '20170712', 'Wednesday', '08:00', '11:00', '04.00.15/FT', 'summary text'],
    [28, '20170712', 'Wednesday', '13:30', '16:30', '04.00.15/FT', 'summary text'],
    [28, '20170713', 'Thursday', '15:15', '18:15', '04.00.15/FT', 'summary text']
]


def create_schedule_dictionary(parsed_data):
    grouped = {}

    for week, date, day, begin, end, room, summary in parsed_data:
        if week not in grouped:
            grouped[week] = {}

        if room not in grouped[week]:
            grouped[week][room] = {"days": {}}

        if day not in grouped[week][room]["days"]:
            grouped[week][room]["days"][day] = []

        grouped[week][room]["days"][day].append({
            "begin": begin,
            "end": end,
            "summary": summary
        })

    return grouped


def save_as_json(schedule_dictionary):
    file_template = './json/{}.json'
    json_file_data = []

    for room in schedule_dictionary:
        schedule_data = schedule_dictionary[room]

        with open(file_template.format(room), 'w') as fout:
            json.dump(schedule_dictionary[room], fout, indent=4, ensure_ascii=False)

        # with open(file_template.format(room)) as json_data:
            # json_file_data = json.load(json_data)

            # if schedule_data != json_file_data:
                # print('{}.json has been changed'.format(room))

                # with open(file_template.format(room), 'w') as fout:
                    # json.dump(schedule_dictionary[room], fout, ensure_ascii=False)


room_online_data = digest_room_website()
parsed_ics_data = parse_ics_data(room_online_data)

schedule = create_schedule_dictionary(parsed_ics_data)

save_as_json(schedule)
