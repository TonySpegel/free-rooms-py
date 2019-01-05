#!/usr/bin/env python
# coding: utf8

from bs4 import BeautifulSoup
import urllib.request
from icalendar import Calendar
import datetime

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

        if option.text == '03.03.33':
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
    extracted_info = []

    for ics_file in ics_files:
        room_ics_id = ics_file[0]                   # SPLUSD17C39

        room_name = ics_file[1]                     # 05.03.37 (HS 2)
        room_name_parts = room_name.split('.')

        building_number = int(room_name_parts[0])   # 5
        floor_number = int(room_name_parts[1])      # 3
        room_number = room_name_parts[2]            # 37 (HS 2)

        ics_url = ics_file[2]

        with urllib.request.urlopen(ics_url, timeout=10) as response:
            try:
                ics_response = Calendar.from_ical(response.read())
            except Exception as error:
                print(error)

            for component in ics_response.walk():
                if component.name == "VEVENT":
                    summary = str(component.get('summary'))
                    lecturer = summary.split(':')[0]
                    summary_short = summary.split(':')[1].lstrip()

                    time_range = [
                        str(component.get('dtstart').dt).replace("'", ""),
                        str(component.get('dtend').dt).replace("'", ""),
                    ]

                    ('"{}"'.format(item) for time in time_range)

                    extracted_info.append({
                        'time_range': time_range,
                        'calendar_week': component.get('dtstart').dt.isocalendar()[1],
                        'building_number': building_number,
                        # 'floor_number': floor_number,
                        # 'room_number': room_number,
                        'summary_short': summary_short,
                        'lecturer': lecturer,
                    })

    sort = sorted(
        extracted_info,
        key=lambda x: (
            x['calendar_week'],
            x['time_range'],
            x['building_number'],
        )
    )

    extracted_info_sorted = sort

    return extracted_info_sorted


data = parse_ics_data(ics_file_list)

for idx, item in enumerate(data, start=1):
    print(item)

print('=================')


