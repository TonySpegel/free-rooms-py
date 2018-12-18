from bs4 import BeautifulSoup
import urllib.request
from icalendar import Calendar
import json
import os


WEEK_INDEX = 0
DATE_INDEX = 1
DAY_INDEX = 2
BEGIN_INDEX = 3
END_INDEX = 4
ROOM_NAME_INDEX = 5
SUMMARY_INDEX = 6


def get_ics_meta_data(rooms_base_url, ics_base_link):
    eah_rooms_website = urllib.request.urlopen(rooms_base_url)
    eah_rooms_website_soup = BeautifulSoup(eah_rooms_website, "lxml")
    # A select-field containing all rooms
    eah_rooms_options_list = eah_rooms_website_soup.select('select[id=id] > option')

    ics_list = []

    # Select drop down and add its elements to a list
    for option in eah_rooms_options_list:
        room_id = option['value']  # SPLUSA8CFB5 - a rooms ID

        # Test if first char is a digit do exclude rooms such as 'Siemens Rudolstadt'
        if option.text[0].isdigit():
            room_name = option.text  # 05.00.03

            # Build download-link using ics_base_link and option_value
            room_ics_link = '{}{}'.format(ics_base_link, room_id)

            ics_list.append([room_id, room_name, room_ics_link])

    return ics_list


ics_file_list = get_ics_meta_data(
    'http://stundenplanung.eah-jena.de/raeume/',
    'http://stundenplanung.eah-jena.de/ical/raum/?id='
)


def parse_ics_data(ics_files):
    for ics_file in ics_files:
        room_id = ics_file[0]

        room_name = ics_file[1]
        room_identifier = room_name.split('.')

        room_building = room_identifier[0]
        room_floor = room_identifier[1]
        room_number = room_identifier[2]

        ics_url = ics_file[2]

        extracted_info = []

        with urllib.request.urlopen(ics_url, timeout=10) as response:
            try:
                ics_response = Calendar.from_ical(response.read())
            except Exception as error:
                print(error)

            for component in ics_response.walk():
                if component.name == "VEVENT":

                    extracted_info.append({
                        'building': room_building,
                        'floor': room_floor,
                        'room': room_number,
                        'calendar_week': component.get('dtstart').dt.isocalendar()[1],
                        'summary': component.get('summary'),
                        'start': component.get('dtstart').dt.isoformat(),
                        'end': component.get('dtend').dt.isoformat(),
                    })

                    sort = sorted(
                        extracted_info,
                        key=lambda x: (x['calendar_week'], x['start'])
                    )

        extracted_info_sorted = sort

    return extracted_info_sorted


data = parse_ics_data(ics_file_list)

for d in data:
    print(d)
