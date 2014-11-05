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


def get_places(origin, destination):
	pass


def main():
	pass

if __name__ == "__main__":
	main()