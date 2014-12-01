### TripWise

#### Description of Basic Features:
TripWise is a trip-planning app that allows travelers to search for a place or business along a route, build a multiple-stop trip, save and retrieve trips, and send trips to a smartphone for navigation.

#### Search for Business along Route:
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

##### Additional Search Inputs
  The search interface provides the user with the option of additional search inputs, including:
  * Mode of transportation. The user chooses from driving, biking, and walking. The choice is stored in the Javascript search object and used to specify the travel mode in the requests to the Directions and Distance Matrix APIs.
  * Sorting method. As discussed above, the user can choose to sort by business rating or by the distance from the route.
  * Openning time. The user can choose to limit search results to those only open at the time of the search. If selected, the app will toggle the "opennow" property to "true" when the request is sent to the Places API.