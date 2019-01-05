#!/usr/bin/env python
# coding: utf8

import urllib.request                   # Request website-data
from bs4 import BeautifulSoup           # Parse website-data
import json                             # Handle JSON files
import os                               # For OS-level operations
import errno                            # Catch errors
from icalendar import Calendar          # parser/generator of iCalendar files
import time
import stat
import datetime

try:
    os.makedirs('json')
except OSError as e:
    if e.errno != errno.EEXIST:
        raise

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


def get_room_meta_data():
    eah_rooms_website = urllib.request.urlopen(EAH_ROOMS_BASE_URL)
    eah_rooms_website_soup = BeautifulSoup(eah_rooms_website, "lxml")
    eah_rooms_options_list = eah_rooms_website_soup.select('select[id=id] > option')

    ics_list = []

    # Select drop down and add its elements to a list
    for option in eah_rooms_options_list:
        room_id = option['value']  # SPLUSA8CFB5 - a rooms ID

        # Test if first char is a digit do exclude rooms such as 'Siemens Rudolstadt'
        if option.text[0].isdigit():
            room_name = option.text  # 05.00.03

            # Build download-link using ICS_BASE_LINK and option_value
            room_ics_link = '{}{}'.format(ICS_BASE_LINK, room_id)

            ics_list.append([room_id, room_name, room_ics_link])

    return ics_list


def parse_ics_data(ics_data):
    extracted_info = []
    number_of_rooms = len(ics_data)

    i = 0

    start = time.time()

    for ics in ics_data:
        room_id = ics[0]
        room_name = ics[1]
        ics_url = ics[2]

        i = i + 1

        end = time.time()
        total_time = time.strftime("%M:%S", time.gmtime(int(end - start)))

        current_begin = datetime.datetime.now()

        with urllib.request.urlopen(ics_url, timeout=10) as response:
            try:
                ics_response = Calendar.from_ical(response.read())
            except Exception as error:
                print(error)

            file_size = '{0:.2f}'.format(int(response.getheader('Content-Length')) / 1024)

            print(
                ' ↓ {} {: >4}/{}   ⏱ {: >5}  Size: {: >6} KiB'.
                format(room_id, i, number_of_rooms, total_time, file_size)
            )

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
                        summary,
                        room_id
                    ])

                    sort = sorted(
                        extracted_info,
                        key=lambda x: (x[WEEK_INDEX], x[DATE_INDEX], x[BEGIN_INDEX])
                    )
    extracted_info_sorted = sort

    return extracted_info_sorted


def get_file_age(path):
    file_template = './json/{}.json'.format(path)
    file_age = ((time.time() - os.stat(file_template)[stat.ST_MTIME]) / 60) / 60

    return file_age


def create_schedule_dictionary(parsed_data):
    grouped = {}

    for week, date, day, begin, end, room, summary, room_id in parsed_data:
        if week not in grouped:
            grouped[week] = {}

        if room not in grouped[week]:
            grouped[week][room] = {
                "id": room_id,
                "days": {}
            }

        if day not in grouped[week][room]["days"]:
            grouped[week][room]["days"][day] = []

        grouped[week][room]["days"][day].append({
            "begin": begin,
            "end": end,
            "summary": summary
        })

    return grouped


def get_work_dir():
    current_file = __file__
    real_path = os.path.realpath(current_file)  # /home/tony/PycharmProjects/free-rooms/rework.py
    dir_path = os.path.dirname(real_path)       # /home/tony/PycharmProjects/free-rooms

    return dir_path


def save_as_json(schedule_dictionary):
    working_directory = get_work_dir()
    file_template = '{}/app/json/{}.json'

    for room in schedule_dictionary:
        with open(file_template.format(working_directory, room), 'w') as fout:
            json.dump(schedule_dictionary[room], fout, ensure_ascii=False, indent=4)


def init():
    room_online_data = get_room_meta_data()
    try:
        parsed_ics_data = parse_ics_data(room_online_data)
    except ValueError:
        with open('./json/log.json', 'w') as fout:
            json.dump('{"04.00.02 (HS7)": {}}', fout, indent=4, ensure_ascii=False)

    schedule = create_schedule_dictionary(parsed_ics_data)
    save_as_json(schedule)


init()
