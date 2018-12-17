from bs4 import BeautifulSoup
import urllib.request
from icalendar import Calendar


def get_room_meta_data(rooms_base_url, ics_base_link):
    eah_rooms_website = urllib.request.urlopen(rooms_base_url)
    eah_rooms_website_soup = BeautifulSoup(eah_rooms_website, "lxml")
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


meta = get_room_meta_data(
    'http://stundenplanung.eah-jena.de/raeume/',
    'http://stundenplanung.eah-jena.de/ical/raum/?id='
)

for m in meta:
    print(m)
