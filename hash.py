#!/usr/bin/env python
# coding: utf8

import urllib.request                   # Request website-data
from bs4 import BeautifulSoup           # Parse website-data
import time
import hashlib


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


def ics_checksum():
    room_online_data = digest_room_website()

    print('MD5 Hashing files')
    start = time.time()
    for room in room_online_data:
        ics_url = room[2]

        with urllib.request.urlopen(ics_url, timeout=10) as response:
            beauty = BeautifulSoup(response, "lxml")
            hash_beauty = hashlib.md5(str(beauty).encode('utf-8')).hexdigest()

            print(hash_beauty)

    end = time.time()
    total_time = time.strftime("%M:%S", time.gmtime(int(end - start)))

    print('MD5 took {}'.format(total_time))

    print('SHA256 Hashing files')
    start = time.time()
    for room in room_online_data:
        ics_url = room[2]

        with urllib.request.urlopen(ics_url, timeout=10) as response:
            beauty = BeautifulSoup(response, "lxml")
            hash_beauty = hashlib.sha256(str(beauty).encode('utf-8')).hexdigest()

            print(hash_beauty)

    end = time.time()
    total_time = time.strftime("%M:%S", time.gmtime(int(end - start)))

    print('SHA256 took {}'.format(total_time))


ics_checksum()
