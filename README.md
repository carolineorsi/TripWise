### OnTheWay

#### Description of Basic Features:
The app will take input from the user (starting point, ending point, and a keyword describing the desired stop along the way) and return a list and map of specific businesses and their distance (in time) from the user's route. Users can then select from the list of business, which will display their complete directions, including the added waypoint, on the map and in text form. A "Send to Phone" button will send a link to the user's phone, allowing them to open the directions in Google Maps.

#### Implementation:
1. Take form input and get user's initial route.
  - Create HTML form
  - Create instance of Google Map on website
  - Use starting and end points to make Google Directions Javascript API request
  - Display Directions results on map
  - Store polyline, initial duration, and initial distance in JavaScript route object
2. Decode polyline into points and search for places
  - Decode polyline using Google Maps API decoding method
  - Reduce number of search points to 10 to avoid hitting API query limits
  - Define radius of Places search based on the estimated distance between search points
  - For each search point, make Google Places API request, using point as location and user's input as keyword
3. Remove duplicates in places list and rank by added duration of overall route
  - Iterate through the place lists returned from each Place request and add places to object within route object, using the unique place id as a key
  - Make two Distance Matrix requests, 1) using the initial starting point as origin and all places as destinations, and 2) using all places as origins and the initial ending point as a destination
  - Sum returned durations and distances and rank from low to high
4. On website, show the top ten closest locations on the map and in list form
  - For each of top ten ranked places, add a marker to the google map and a div element in the control bar with the place details
  - Place details shown will include the place name and amount of time added to the initial route (calculated by subtracting the initial route duration from the total duration)
  - Create info window for each marker that contains business details. Set to appear on a mouse hover.
5. 
	
