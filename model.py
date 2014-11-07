import urllib2
import json
import os
import map_data
from flask import make_response

# Set authorization key
AUTH_KEY = os.environ.get('GOOGLE_API_KEY')

class Route(object):

	def __init__(self, 
				start, 
				end, 
				keyword,
				radius,
				polyline, 
				initial_duration, 
				initial_distance):
		self.start = start
		self.end = end
		self.keyword = keyword
		self.radius = int(radius)
		self.polyline = polyline
		self.initial_duration = initial_duration
		self.initial_distance = initial_distance
		self.places = {}

	def get_places(self):
		for latlng in self.polyline:
			url = ('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s'
				'&radius=%d'
				'&keyword=%s'
				'&key=%s') % (latlng, self.radius, self.keyword, AUTH_KEY)
			
			response = map_data.send_request(url)

			for place in response['results']:
				latlng = str(place['geometry']['location']['lat']) + "," + str(place['geometry']['location']['lng'])
				self.places[latlng] = {}
				self.places[latlng]['place'] = Place(place['name'], 
											place['place_id'], 
											place['geometry']['location']['lat'], 
											place['geometry']['location']['lng'])


class Place(object):

	def __init__(self, name, place_id, lat, lng):
		self.name = name
		self.place_id = place_id
		self.lat = lat
		self.lng = lng

