### TripWise

#### Basic Description:
TripWise is a trip-planning app that allows travelers to search for a place or business along a route, build a multiple-stop trip, save and retrieve trips, and send trips to a smartphone for navigation.

#### Technologies Used:
JavaScript, Google Maps JavaScript APIs (Directions, Places, Distance Matrix, and Geocoding), JQuery, Underscore.js, HTML, CSS, Flask, Python, Jinja ,SQLite, SQLAlchemy, Twilio API

#### Detailed Description of Features:

##### Search for Business along Route:
TripWise uses numerous tools from the Google Maps JavaScript API suite to search for places along the route, including the Directions, Places, Distance Matrix, and Geocoding services. The search is completed client-side using the following steps:
  1. The app retrieves an encoded polyline object from the Google Directions API and decodes it into an array of point objects that contain the associated latitude and longitude.
  2. The getSearchPoints function reduces the polyline array into a smaller array of search points that are spaced along the route at a distance equal to the search radius for each point, which provides some overlap of the search areas for each point. The search radius varies based on the total length of the route, and is equal to 15% of the route length (up to 50km, which is the maximum search radius allowed by the Google Places API).
  3. For earch search point in the array, the getPlaces function calls the Google Places API and searches for places matching the search keyword provided by the user. The Places API returns an array of place objects.
  4. TripWise stores the place objects within a JavaScript object, using the Google place ID as the key in order to remove duplicate entries. 
  5. The places are ranked using one of two ranking algorithms, depending on the user's selection:
    * Sort By Highest Rating compares business rating details provided in the Places API response and sorts higher-rated businesses to the beginning of the list.
    * Sort by Distance From Route calculates the distance of each place to the points in the polyline array and sorts closer places to the beginning of the list.
  6. The app calls the Distance Matrix API to retrieve the travel durations to each waypoint from the start, and from each waypoint to the trip end, sums the values, and compares the total to the original trip duration in order to determine the total time that the stop will add to the trip. (Note: In order to prevent exceedance of Google API query limits, only the top ten ranked places are sent to the API in the initial request. Additional calls are sent for the remaining items as the user requests "More Results".)
  7. The app adds marker objects to the map corresponding to the top ten results and returns a list of the results to the user, using JQuery to change the DOM.

**Additional Search Inputs**
  The search interface provides the user with the option of additional search inputs, including:
  * Mode of transportation. The user chooses from driving, biking, and walking. The choice is stored in the Javascript search object and used to specify the travel mode in the requests to the Directions and Distance Matrix APIs.
  * Sorting method. As discussed above, the user can choose to sort by business rating or by the distance from the route.
  * Opening time. The user can choose to limit search results to those only open at the time of the search. If selected, the app will toggle the "opennow" property to "true" when the request is sent to the Places API.

##### Build Route with Multiple Stops:
The data structures used by the app allow users to complete multiple searches to build a journey with numerous destinations. As each new stop is chosen, the app creates a new Waypoint object that is stored within an array in the Route object. The app then makes a new call to the Directions API, passing the new waypoint object along with the original search parameters. If there are multiple waypoints, the Directions API optimizes the route and returns the waypoint order in an array. The reorderWaypoints function uses the waypoint order array to sort the waypoints that are stored in the route object.

##### Create Account, Log In, and Trip Saving:
The Create Account and Log In features are included as drop-down items on the site's navigation bar for easy access. Upon submittal, the app makes an AJAX request to the server, and the database is queried or updated as appropriate. Passlib, a Python password hashing library, is used to store and verify passwords in the database. Once logged in, the app updates the navigation bar using JQuery. The user's ID is stored in the Flask session.

While logged in, users may save a trip or access previously saved trips using anchors on the site navigation bar. When Save Trip is clicked, an appropriate AJAX call is made to the server to create the database records. A route record is stored that references the user ID, a unique route ID, and other key route details such as starting and ending points. The associated Waypoints are stored in a waypoints table and reference back to the route using the route ID. SQLAlchemy is used to create, query, and update the database, and to define relationships between tables.

When the user clicks to retrieve saved trips, the database is queried for routes associated with the user ID, and for waypoints associated with the user's routes. The server returns an object that contains the route details. JQuery is used to show and populate the saved trip list.

##### Send Trip to Phone:
TripWise employs the Twilio API to send route links to a user's phone. A request to the API begins when the user clicks the "Send to Phone" button. If the user is logged in, the app will set the request phone number to the user's stored number; otherwise, the app prompts the user for a phone number. The Twilio API is called from the server-side (Python) script. The send_to_phone function calls the Twilio API once for each waypoint in the route. Each message contains a URL for directions to the waypoint from the prior point. The URL is specially formatted to open in the Google Maps app for navigation.

##### Error Handling and User Input Verification:
Because TripWise is interactive and accepts a significant amount of user input, input verification and error handling have been built in to prevent improper input.
  * If the user does not input required search parameters (start, end, and keyword), they will be prompted to verify their inputs.
  * If the Google Directions API is not able to provide results based on the provided start and end points, the user will be prompted to verify their inputs.
  * If no results are returned by the Places API request, an alert will inform the user that no places were found to match their search keyword.
  * If the user does not provide required inputs when creating an account, logging in, or saving a route, an alert will prompt them to verify their inputs. An alert will also be shown if the login password is incorrect, or if the user tries to create an account with an email already in the user database.
  * When sending a message to a smartphone, the app parses and validates the phone number format before sending the request to the Twilio API. If the message send still fails, the user is prompted to verify the entered phone number.


