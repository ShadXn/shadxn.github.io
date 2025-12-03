Training Game
===============

A small, local-first web app that gamifies IRL activities (run, jog, walk, cycle, power training).

What it does
- Let users pick activities (durations) and mark them complete.
- Grants XP and gold for each completed activity.
- Tracks counts per activity per day (max 3 per day by default).
- Persists user and state in localStorage.
- Simple shop demo to spend gold for XP.

How to run
1. Open `index.html` from the `training-game` folder in your browser (double-click or use "Open File...").
2. On first run you'll be asked for a username.
3. Tap activity duration buttons to complete activities.

Notes
- The app stores everything in localStorage. To reset all data, clear the browser storage for the site.
- Daily counts reset automatically when the date changes. There's also a "Reset Day (debug)" button for testing.

Future ideas
- Add more activities and more meaningful shop items.
- Sync to cloud for multi-device.
- Add streaks, achievements, and a more advanced level/skill system.

Project structure
- index.html — main page
- css/styles.css — styles
- js/app.js — application logic
- data/activities.json — activity definitions

