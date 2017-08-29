#!/usr/bin/env python
# coding: utf8

"""
free-rooms-eah.py:
This script is used to download and handle ics-calendar files provided by
the Ernst-Abbe-Hochschule Jena to process them into JSON files.
These JSON-files are the backbone of a Web-App to show users available
rooms at this university.
"""

import urllib.request                   # Request website-data
from bs4 import BeautifulSoup           # Parse website-data
import json                             # Handle JSON files
import os                               # For OS-level operations
import errno                            # Catch errors
from icalendar import Calendar          # parser/generator of iCalendar files
from collections import defaultdict     # TODO: find out what this lib does
import time                             # To executing time

__author__ = 'Tony Spegel'
__doc__ = '20170715'                    # The time this project was started

CW_WEEK_INDEX = 0
DATE_INDEX = 1
DAY_INDEX = 2
BEGIN_INDEX = 3
END_INDEX = 4
SUMMARY_INDEX = 5

# If the 'json' and 'ics' folders have not yet been created, create them.
try:
    os.makedirs('ics')
    os.makedirs('json')
except OSError as e:
    if e.errno != errno.EEXIST:
        raise

room_links = []

# Link is used as a template to download ics-files
ICS_BASE_LINK = 'http://stundenplanung.eah-jena.de/ical/raum/?id='

# Link which represents the entry-point to download every calendar-file
EAH_ROOMS_BASE_URL = "http://stundenplanung.eah-jena.de/raeume/"


# This function parses the EAH-website or to put it more precisely a certain select field.
# These values inside the select field are used to build download links, IDs and name-fields.
def digest_room_website():
    eah_rooms_website = urllib.request.urlopen(EAH_ROOMS_BASE_URL)
    eah_rooms_website_soup = BeautifulSoup(eah_rooms_website, "lxml")
    eah_rooms_options_list = eah_rooms_website_soup.select('select[id=id] > option')

    # Select drop down and add its elements to a list
    for option in eah_rooms_options_list:
        option_value = option['value']  # SPLUSA8CFB5 - a rooms ID

        # Test if first char is a digit do exclude rooms such as:
        if option.text[0].isdigit():
            option_text = option.text  # 05.00.03

            # Build download-link using ICS_BASE_LINK and option_value
            ics_link = '{}{}'.format(ICS_BASE_LINK, option_value)

            room_links.append([option_value, option_text, ics_link])


# digest_room_website()


def download_ics():
    for item in room_links:
        room_id = item[0]
        room_name = item[1].replace('/', '-')
        download_url = item[2]
        ics_filename = './ics/{}_{}.ics'.format(room_name, room_id)

        urllib.request.urlretrieve(download_url, ics_filename)

# print('Start downloading calendar-files')
# start = time.time()
# download_ics()
# end = time.time()
# print('download_ics took {}'.format(end - start))

extracted_info = []


# Splits a filename like this
# '04.00.22(Reinr.)_SPLUS5637AE' into:
# 04, 00, 22(Reinr.), SPLUS5637AE
# These values are used as key value pairs in a JSON later on
def split_room_filename(str_element):
    # Splits '04.00.22(Reinr.)_SPLUS5637AE' into
    # room_full_identifier = 04.00.22(Reinr.)
    # room_id              = SPLUS5637AE
    room_full_identifier, room_id = str_element.split('_')
    room_id = ''.join(room_id.split('.')[:-1])

    # Splits '04.00.22(Reinr.)' into
    # 04, 00, 22(Reinr.)

    # room_full_identifier can contain another dot, which shouldn't be split.
    # Therefore maxsplit=2 is used, which splits only the first two occurrences of a dot.
    house, floor, room_number = room_full_identifier.split('.', maxsplit=2)

    return house, floor, room_number, room_id


def build_json_object(
        building_number,
        floor_number,
        room_number,
        room_id,
        entries
):
    result = []

    grouped_by_week = defaultdict(list)

    for entry in entries:
        grouped_by_week[entry[CW_WEEK_INDEX]].append(entry)

    for week, week_entries in grouped_by_week.items():
        grouped_by_day = defaultdict(list)

        # This includes every lecture on a given day,
        # and wraps these inside of a day -> monday [{begin, end, summary}]
        for entry in week_entries:
            grouped_by_day[entry[DAY_INDEX]].append({
                'begin': entry[BEGIN_INDEX],
                'end': entry[END_INDEX],
                'summary': entry[SUMMARY_INDEX]
            })

        result.append({
            'cw': str(week),
            'days': grouped_by_day,
            'room': '{}.{}.{}'.format(building_number, floor_number, room_number),
            'id': room_id,
            'building': building_number,
            'floor': floor_number,
            'room_number': room_number,
        })

    return result


def save_as_json(cw, room_id, file_id, processed_json):
    file_template = './json/{}_{}_{}.json'

    with open(file_template.format(cw, room_id, file_id), 'w') as fout:
        json.dump(processed_json, fout, indent=4, ensure_ascii=False)


# Prototype function. Not yet used. Should be used for new JSON-format.
# This new format is structured
def save_as_json_ex(cw, processed_json):
    file_template = './json/{}.json'

    with open(file_template.format(cw), 'w') as fout:
        json.dump(processed_json, fout, indent=4, ensure_ascii=False)


def build_calendar_json(result):
    [
        save_as_json(
            dictionary['cw'],
            dictionary['room'],
            dictionary['id'],
            dictionary
        ) for dictionary in result
    ]


def extract_info_from_ics():
    for filename in os.listdir('./ics/'):
        room_calendar_file = open('./ics/{}'.format(filename), 'rb')
        gcal = Calendar.from_ical(room_calendar_file.read())

        # Create variables using the filename
        building_number, floor_number, room_number, room_id = split_room_filename(filename)

        for component in gcal.walk():
            if component.name == "VEVENT":
                summary = component.get('summary')
                start_time = component.get('dtstart').dt     # Lecture starts at this time
                end_time = component.get('dtend').dt         # Lecture ends at this time
                calendar_week = start_time.isocalendar()[1]  # The number of a week starting w/ Monday

                extracted_info.append([
                    calendar_week,
                    start_time.strftime('%Y%m%d'),  # Y - Year: 2017, m - Month: 12, d - Day: 31
                    start_time.strftime('%A'),      # A - Weekday: Monday
                    start_time.strftime('%H:%M'),   # H - Hour: 13, M - Minute: 37
                    end_time.strftime('%H:%M'),
                    summary
                ])

                print(extracted_info)

        # Sorts every entry by using its calendar-week, date and time of beginning.
        # Therefore any entry should be sorted in an ascending order.
        extracted_info_sorted = sorted(
            extracted_info,
            key=lambda x: (x[CW_WEEK_INDEX], x[DATE_INDEX], x[BEGIN_INDEX])
        )

        # After getting the needed information close the current file
        room_calendar_file.close()

        # Prepair values for build_calendar_json
        compiled_json = build_json_object(
            building_number,
            floor_number,
            room_number,
            room_id,
            extracted_info_sorted
        )

        # Build the JSON files
        build_calendar_json(compiled_json)

        # Clear the current list to work with the next room
        extracted_info.clear()

extract_info_from_ics()
