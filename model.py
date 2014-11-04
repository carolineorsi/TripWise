import map_data

class Route():

	def __init__(self, origin, destination):
		self.origin = origin.replace(" ", "+")
		self.destination = destination.replace(" ", "+")
		self.directions = map_data.get_initial_route(self.origin, self.destination)
