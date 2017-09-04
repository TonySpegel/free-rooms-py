# Purpose of this project

This project will act as a frontend to search for available rooms at the 
University of applied Sciences Jena (EAH Jena). Until recently there was no possibility
of finding available rooms that don't have classes being held. Even though 
there's now a way (there wasn't one when I've started this project),
this project is to be seen as an improved solution that offers more information
in less clicks and more possible filtering options of the results while being more
aesthetically pleasing.

# Technial decisions

The EAH Jena provides its calendar files either in an iCal or RSS format.
These iCal files include one room and its schedule for every week
from the beginning of a semester to its end. My [Python project](https://github.com/TonySpegel/free-rooms-py) 
(will download) downloads these files and processes them into JSON files following this scheme:
calendar_week.json -> room {begin, end, ...}, room_2 {begin, end, ...}

The usual flow to find a room could be something like this:
A user wants to find a free room right now and therefore:
1. Opens the Web-App
2. Gets available rooms (probably on click or via autoload as a setting)
optional:
3. Filters the results by buildings and / or floors.

Structuring the data on a calendar week-base offers an advantage in loading JSON files easily; get the current calendar-week and load the corresponding file (41.json).

## Visual aspects
This project features the [Material Design Components Web Library](https://material.io/components/web/catalog/) because I 
like its style and clean visuals.

The choice of the frontend framework: I have not decided which framework (if at all) I'll use. I tend to choose either Vue.js or Angular.

# FAQ

> Your JSON approach begs for the use of a database, wouldn't that be the sane thing to do?

That's right but I've wanted it this way to keep it as free from external dependencies as possible. This offers another advantage as its possible to host this project on a static site hosting plattform such as Firebase or Github Pages without installing any additional software.
