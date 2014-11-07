# import map_data

import urllib2
import json
import os
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

	def get_places(self):
		places = []

		# for latlng in self.polyline:
		# 	url = ('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s'
		# 		'&radius=%d'
		# 		'&keyword=%s'
		# 		'&key=%s') % (latlng, self.radius, self.keyword, AUTH_KEY)
		
		polyline_length = len(self.polyline)
		increment = polyline_length / 10
		for i in range (increment / 2, polyline_length, increment):
			url = ('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s'
				'&radius=%d'
				'&keyword=%s'
				'&key=%s') % (self.polyline[i], self.radius, self.keyword, AUTH_KEY)
			
			response = urllib2.urlopen(url)

			# Get the response and use the JSON library to decode the JSON
			json_raw = response.read()
			json_data = json.loads(json_raw)

			for place in json_data['results']:
				if place['name'] not in places:
					places.append(place['name'])

			print places

    # return _convert_to_JSON(places)


class Place(object):
	pass