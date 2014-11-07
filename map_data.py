import urllib2
import json
import os
import model
import urllib

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
 	response = urllib2.urlopen(url)

  	# Get the response and use the JSON library to decode the JSON
 	json_raw = response.read()
 	json_data = json.loads(json_raw)

	return json_data

def send_request(url):
	# response = urllib2.urlopen(url)
	response = urllib.urlopen(url)

	# Get the response and use the JSON library to decode the JSON
	json_raw = response.read()
	json_data = json.loads(json_raw)

	return json_data

def optimize_polyline(raw_polyline):
    polyline = raw_polyline[2:-3].split('","')
    polyline_length = len(polyline)
    increment = polyline_length / 10
    new_polyline = []
    for i in range(increment / 2, polyline_length, increment):
        new_polyline.append(polyline[i])
    return new_polyline


def find_top_ten(route):
    # destinations = ""
    destinations = []

    for latlng, place in route.places.iteritems():
        # destinations += latlng + "|"
        destinations.append(latlng)

    destinations_string = "|".join(destinations)
    
    url_start = ('https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s'
        '&destinations=%s'
        '&key=%s') % (route.start, destinations_string, model.AUTH_KEY)

    url_end = ('https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s'
        '&destinations=%s'
        '&key=%s') % (route.end, destinations_string, model.AUTH_KEY)

    # contents = urllib.urlopen(url_start).read()
    # print "We did it!"

    # url_test = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=683 sutter st, sf, ca&destinations=37.790901,-122.420939&key=AIzaSyDdYX2uSHJsvjQhI2eJo-6peidlfFlMvIs"

    # print url_start
    # print url_end

    # result = send_request(url_test)

    start_distances = send_request(url_start)
    end_distances = send_request(url_end)

    num_destinations = len(destinations)
    for i in range(num_destinations):
    	latlng = destinations[i]
    	distance = start_distances['rows'][0]['elements'][i]['distance']['value'] + end_distances['rows'][0]['elements'][i]['distance']['value']
    	duration = start_distances['rows'][0]['elements'][i]['duration']['value'] + end_distances['rows'][0]['elements'][i]['duration']['value']
    	route.places[latlng]['distance'] = distance
    	route.places[latlng]['duration'] = distance
    	print route.places[latlng]['distance'], route.places[latlng]['duration']



def get_places(origin, destination):
	pass


def main():
	pass

if __name__ == "__main__":
	main()