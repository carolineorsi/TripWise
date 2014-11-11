# import urllib2
import json
import os
import model
# import urllib
import requests
from operator import itemgetter

# Set authorization key
AUTH_KEY = os.environ.get('GOOGLE_API_KEY')
# origin = "3896+19th+St,SF,CA"
# destination = "683+Sutter+St,SF,CA"


def get_initial_route(origin, destination):
    """ Using start and end point from user, get directions. """

    url = ('https://maps.googleapis.com/maps/api/directions/json?origin=%s'
            '&destination=%s'
            '&key=%s') % (origin, destination, AUTH_KEY)

    # Send the GET request to the Place details service (using url from above)
    # response = urllib2.urlopen(url)
    response = requests.get(url)

    # Get the response and use the JSON library to decode the JSON
    # json_raw = response.read()
    # json_data = json.loads(json_raw)
    json_data = response.json()

    return json_data


def send_request(url):
    """ Sends HTTP request using complete query url. """

    # response = urllib2.urlopen(url)
    # response = urllib.urlopen(url)
    response = requests.get(url)

    # Get the response and use the JSON library to decode the JSON
    # json_raw = response.read()
    # json_data = json.loads(json_raw)
    json_data = response.json()

    return json_data


def optimize_polyline(raw_polyline):
    """ Accepts the complete polyline from the initial directions request and reduces the number of points to 10 to create a more managable API request. """

    polyline = raw_polyline[2:-3].split('","')
    polyline_length = len(polyline)
    increment = polyline_length / 10
    new_polyline = []
    for i in range(increment / 2, polyline_length, increment):
        new_polyline.append(polyline[i])
    return new_polyline


def calculate_added_distance(route):
    """ Makes a request to the Google Distance Matrix API to obtain the distance
    and duration from the origin to each point, and from each point to each
    destination. Sums the distances and durations and appends them to the place
    dictionary. """

    places_list = []
    for latlng, place in route.places.iteritems():
        places_list.append(latlng)
    places_string = "|".join(places_list)
    
    url_start = ('https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s'
        '&destinations=%s'
        '&key=%s') % (route.start, places_string, model.AUTH_KEY)

    url_end = ('https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s'
        '&destinations=%s'
        '&key=%s') % (places_string, route.end, model.AUTH_KEY)

    # NOTE TO SELF: Need to adjust this to make sure that distances, durations returned
    # for each place to the end point are the right direction (i.e. place to end, not the
    # other way around.)

    # print "***********************"
    # print url_start
    # print url_end
    # print "***********************"

    start_distances = send_request(url_start)
    end_distances = send_request(url_end)

    num_places = len(places_list)
    for i in range(num_places):
    	latlng = places_list[i]
    	distance = start_distances['rows'][0]['elements'][i]['distance']['value'] + end_distances['rows'][i]['elements'][0]['distance']['value']
    	duration = start_distances['rows'][0]['elements'][i]['duration']['value'] + end_distances['rows'][i]['elements'][0]['duration']['value']
    	route.places[latlng]['distance'] = distance
    	route.places[latlng]['duration'] = duration

def return_top_ten(route):
	sorted_list = []
	for key, value in route.places.iteritems():
		sorted_list.append((value['duration'], key))
	sorted_list.sort()
	
	top_ten = []
	for place in sorted_list[0:11]:
		top_ten.append(route.places[place[1]])

	return top_ten


def main():
	pass

if __name__ == "__main__":
	main()