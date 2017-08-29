import json
from collections import defaultdict


WEEK_IDX = 0
DAY_IDX = 2
BEGIN_IDX = 3
END_IDX = 4
DURATION_IDX = 5
SUMMARY_IDX = 6

# data from parsing input json
room = '05.00.10'
building, floor, room_number = room.split('.')
doc_id = 'SPLUSD17C56'
cells = [
    [14, '20170403', 'Monday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170403', 'Monday', '11:30', '13:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170403', 'Monday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170403', 'Monday', '15:15', '16:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170404', 'Tuesday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170404', 'Tuesday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170404', 'Tuesday', '11:15', '12:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170404', 'Tuesday', '17:00', '20:00', '3:00:00', 'Zusammenfassung Test Rhea'],
    [14, '20170405', 'Wednesday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170405', 'Wednesday', '11:15', '12:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170405', 'Wednesday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170406', 'Thursday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170406', 'Thursday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170406', 'Thursday', '11:30', '13:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170406', 'Thursday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170407', 'Friday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170407', 'Friday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [14, '20170407', 'Friday', '15:15', '16:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170410', 'Monday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170410', 'Monday', '11:30', '13:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170410', 'Monday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170410', 'Monday', '15:15', '16:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170410', 'Monday', '17:00', '18:30', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170411', 'Tuesday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170411', 'Tuesday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170411', 'Tuesday', '11:15', '12:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170411', 'Tuesday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170411', 'Tuesday', '15:15', '16:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170412', 'Wednesday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170412', 'Wednesday', '11:15', '12:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170412', 'Wednesday', '18:30', '20:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170413', 'Thursday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170413', 'Thursday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170413', 'Thursday', '11:30', '13:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [15, '20170413', 'Thursday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170419', 'Wednesday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170419', 'Wednesday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170419', 'Wednesday', '11:15', '12:45', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170419', 'Wednesday', '15:15', '18:15', '3:00:00', 'Zusammenfassung Test Rhea'],
    [16, '20170420', 'Thursday', '07:45', '09:15', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170420', 'Thursday', '09:30', '11:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170420', 'Thursday', '11:30', '13:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170420', 'Thursday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170420', 'Thursday', '15:15', '19:00', '3:45:00', 'Zusammenfassung Test Rhea'],
    [16, '20170421', 'Friday', '07:45', '11:00', '3:15:00', 'Zusammenfassung Test Rhea'],
    [16, '20170421', 'Friday', '11:30', '13:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170421', 'Friday', '13:30', '15:00', '1:30:00', 'Zusammenfassung Test Rhea'],
    [16, '20170421', 'Friday', '15:15', '16:45', '1:30:00', 'Zusammenfassung Test Rhea'],
]


grouped_by_week = defaultdict(list)
for entry in cells:
    grouped_by_week[entry[WEEK_IDX]].append(entry)

result = []
for week, week_entries in grouped_by_week.items():
    grouped_by_day = defaultdict(list)
    for entry in week_entries:
        grouped_by_day[entry[DAY_IDX]].append(
            {
                'begin': entry[BEGIN_IDX],
                'end': entry[END_IDX],
                'summary': entry[SUMMARY_IDX],
            }
        )

    result.append(
        {
            'cw': str(week),
            'days': grouped_by_day,
            'room': room,
            'id': doc_id,
            'building': building,
            'floor': floor,
            'room_number': room_number,
        }
    )

# to have this nice UNICODE output, add param: ensure_ascii=False
result_json = json.dumps(result, indent=4)

for res in result_json:
    print(res)
