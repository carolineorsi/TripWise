from twilio.rest import TwilioRestClient
from flask import Flask, request
import os
import twilio.twiml

# Configurate Twilio keys
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_NUMBER = os.environ.get('TWILIO_NUMBER')

app = Flask(__name__)


def send_message(msg, url, phone_num):
    """ Sends message via Twilio to a user's phone number. """

    client = TwilioRestClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    number_to_text = "+1" + phone_num
    text_body = msg + url

    try:
        message = client.messages.create(from_=TWILIO_NUMBER,
                                         to=number_to_text,
                                         body=text_body)

        return "success"
    except:
        return "failure"


def build_url(saddr, daddr, directionsmode):
    """ Creates the Google Maps iOS app URL to send in text message. """

    saddr = saddr.replace(" ", "+")
    daddr = daddr.replace(" ", "+")
    url = ("comgooglemaps://?saddr=%s&daddr=%s&directionsmode=%s") % \
          (saddr,
           daddr,
           directionsmode)
    return url


def validate_phone(phone):
    """ Checks that an entered phone number follows the standard format. """

    valid_num = True

    if len(phone) != 10:
        valid_num = False

    else:
        for character in phone:
            if not character.isdigit():
                valid_num = False
                break

    return valid_num


if __name__ == "__main__":
    app.run(debug=True)
