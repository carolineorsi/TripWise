import map_data

class Route():

	def __init__(self, origin, destination):
		self.origin = origin.replace(" ", "+")
		self.destination = destination.replace(" ", "+")
		
	def get_directions(self):
		self.directions = map_data.get_initial_route(self.origin, self.destination)

		# # Get distance in meters
		# self.distance = self.directions['routes'][0]['legs'][0]['distance']['value']

		# #Get duration in seconds
		# self.duration = self.directions['routes'][0]['legs'][0]['duration']['value']
