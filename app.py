from flask import Flask, request, session, render_template, g, redirect, url_for, flash
import jinja2
import os
import model
import map_data
import phone

app = Flask(__name__)
app.secret_key = 'kbegw*^6^Fhjkh'

@app.route("/")
def index():
    """This is the 'cover' page of the site"""
    return render_template("directions.html")


@app.route("/send_to_phone", methods=["GET"])
def send_to_phone():
    message = request.args.get('message')
    phone.send_message(message)
    return message


# @app.route("/getplaces", methods=["GET"])
# def get_places():
#     start = request.args.get('start')
#     end = request.args.get('end')
#     keyword = request.args.get('keyword')
#     radius = request.args.get('radius')
#     initial_duration = request.args.get('initialDuration')
#     initial_distance = request.args.get('initialDistance')

#     raw_polyline = request.args.get('polyline')
#     polyline = map_data.optimize_polyline(raw_polyline)

#     route = model.Route(start, end, keyword, float(radius), polyline, int(initial_duration), int(initial_distance))
    
#     route.get_places()
#     map_data.calculate_added_distance(route)
#     top_ten = map_data.return_top_ten(route)

#     for item in top_ten:
#         print item['place'].name, "-", ((item['duration'] - route.initial_duration) / 60), "mins added to trip"

#     return "worked"




# @app.route("/directions")
# def list_directions():
#     """Prints out directions from user input"""
#     origin = request.args.get("origin")
#     destination = request.args.get("destination")

#     route = model.Route(origin, destination)
#     route.get_directions()


#     # Checks that valid results were returned from Google Directions API
#     if route.directions['status'] == 'OK':
#         direction_steps = []
#         for step in route.directions['routes'][0]['legs'][0]['steps']:
#             direction_steps.append(step['html_instructions'])
        
#         return render_template("test.html", direction_steps=direction_steps, distance=route.distance, duration=route.duration, polyline=route.polyline)

#     else:
#         direction_steps = ["It didn't work"]
#         return render_template("test.html", direction_steps=direction_steps)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
