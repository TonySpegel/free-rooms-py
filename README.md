# Purpose of this project

This script is used to download and handle ics-calendar files provided by
the Ernst-Abbe-Hochschule Jena to process them into JSON files.
These JSON-files are the backbone of a Web-App to show users available
rooms at this university

# Why?

I was not satisfied with the current solution provided by my university
and took this as a opportunity to learn Python among other things.
Therefore: my Code wont be that good as I have little to no experience using Python.
Feel free to raise any bugs or suggestions for improvement.

# What are these folders used for?

/ics/ is the directory in which every calendar-file for every room is located.
Each of this files spans across multiple calendar-weeks.

/json/ ise the directory in which every processed JSON file is located.
As for now each file represents one calendar-week and one room - e. g.: 14_05.00.01.json.
Every room is structured in this way: Building_Floor_Room-Number.
However this structure is not optimal for my frontend, the plan is to restructure this more like this:
14.json which means every room for this calendar-week. See 14.json in this directory as an example.
