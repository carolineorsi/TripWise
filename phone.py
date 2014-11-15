from twilio.rest import TwilioRestClient
from flask import Flask, request
import os
import twilio.twiml

# configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_NUMBER = os.environ.get('TWILIO_NUMBER')

app = Flask(__name__)

def send_message():
    client = TwilioRestClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    number_to_text = "+18029890078"

    message = client.messages.create(from_=TWILIO_NUMBER,
                                    to=number_to_text,
                                    body="You are the best ever!")

if __name__ == "__main__":
    app.run(debug=True)