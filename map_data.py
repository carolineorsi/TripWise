import urllib2
import json
import os

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



# def test_function():

# 	# Define the location coordinates
# 	LOCATION = '37.787930,-122.4074990'

# 	# Define the radius (in meters) for the search
# 	RADIUS = 5000

# 	# Compose a URL to query a predefined location with a radius of 5000 meters
# 	url = ('https://maps.googleapis.com/maps/api/place/search/json?location=%s'
# 	         '&radius=%s&key=%s') % (LOCATION, RADIUS, AUTH_KEY)


# 	# Send the GET request to the Place details service (using url from above)
# 	response = urllib2.urlopen(url)

# 	# Get the response and use the JSON library to decode the JSON
# 	json_raw = response.read()
# 	json_data = json.loads(json_raw)

# 	# Iterate through the results and print them to the console
# 	if json_data['status'] == 'OK':
# 	  for place in json_data['results']:
# 	    print '%s: %s, lat: %s, long: %s\n' % (place['name'], place['place_id'], place['geometry']['location']['lat'], place['geometry']['location']['lng'])

def main():
	get_initial_route(origin, destination)

if __name__ == "__main__":
	main()