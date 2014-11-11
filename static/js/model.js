function Route(start, end, keyword) {
	this.start = start;
	this.end = end;
	this.keyword = keyword;
	this.places = {};
}


function Place(name, id, lat, lng, location) {
	this.name = name;
	this.id = id;
	this.lat = lat;
	this.lng = lng;
	this.location = location;
}


function distanceMatrixRequest(origins, destinations, travelMode) {
	this.origins = origins;
	this.destinations = destinations;
	this.travelMode = travelMode
}


function placesRequest(location, radius, keyword) {
	this.location = location;
	this.radius = radius;
	this.rankby = 'distance';
	this.keyword = keyword
}


function directionsRequest(origin, destination, travelMode) {
	this.origin = origin;
	this.destination = destination;
	this.travelMode = travelMode
}
