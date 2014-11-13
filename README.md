### OnTheWay

#### Description of Basic Features:
The app will take input from the user (starting point, ending point, and a keyword describing the desired stop along the way) and return a list and map of specific businesses and their distance (in time) from the user's route. Users can then select from the list of business, which will display their complete directions, including the added waypoint, on the map and in text form. A "Send to Phone" button will send a link to the user's phone, allowing them to open the directions in Google Maps.

#### Implementation:
1. ~~Take form input and get user's initial route.~~
  - ~~Create HTML form~~
  - ~~Create instance of Google Map on website~~
  - ~~Use starting and end points to make Google Directions Javascript API request~~
  - ~~Display Directions results on map~~
  - ~~Store polyline, initial duration, and initial distance in JavaScript route object~~
2. ~~Decode polyline into points and search for places~~
  - ~~Decode polyline using Google Maps API decoding method~~
  - ~~Reduce number of search points to 10 to avoid hitting API query limits~~
  - ~~Define radius of Places search based on the estimated distance between search points~~
  - ~~For each search point, make Google Places API request, using point as location and user's input as keyword~~
3. ~~Remove duplicates in places list and rank by added duration of overall route~~
  - ~~Iterate through the place lists returned from each Place request and add places to object within route object, using the unique place id as a key~~
  - Make two Distance Matrix requests, 1) using the initial starting point as origin and all places as destinations, and 2) using all places as origins and the initial ending point as a destination NOTE: GOOGLE QUERY LIMITS REQUESTS TO 25 PLACES PER REQUEST. NEED TO OPTIMIZE REQUESTS.
  - ~~Sum returned durations and distances and rank from low to high~~
4. On website, show the top ten closest locations on the map and in list form
  - ~~For each of top ten ranked places, add a marker to the google map and a div element in the control bar with the place details~~
  - ~~Place details shown will include the place name and amount of time added to the initial route (calculated by subtracting the initial route duration from the total duration)~~
  - ~~Create info window for each marker that contains business details. Set to appear on a mouse hover.~~
  - When the mouse hovers on a list item, highlight the associated marker object, and vice versa.
5. Update control bar details when a place is clicked, either in the control bar list or on the map
	- When clicked, create a waypoint object containing the place location NOTE: SO FAR ONLY WORKS WHEN CLICKING ON MARKER
	- ~~Send new Google Directions request using same origin and destinations and adding the waypoint~~
	- Update map to show new route
	- Empty div item containing list of places
	- In place of list of places, show a div with step-by-step route directions with the new route
6. Add "Send to Phone" button
	- When route is updated, add a Send to Phone button that makes an AJAX call to Flask
	- Data to send in GET request: route information, user's phone number
	- Write Python script using Twilio API to send a URL to user's phone number with a link to the route
	- Format the URL to open directly in Google Maps App on phone

####Additional Features to Add:
- Autocomplete of input fields
- Geolocation to allow user to input current location as starting point
- User login feature to allow user to save routes
- Multiple waypoint feature
- Draggable routes, so that user can specify route preference.
- Allow user to specify mode of transportation (walking, biking, driving)
- Add "open now" checkbox
	
