import datetime
import json
import os

from flask import Flask, request
from pprint import pprint


DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
try:
    os.mkdir(DATA_DIR)
except OSError:
    # already exists
    pass

def get_current_filename():
    now = datetime.datetime.now()
    fmt = '%Y-%m-%d'

    return now.strftime(fmt)


app = Flask('Elasticboard listener')


@app.route('/', methods=['POST'])
def got_event():
    event = json.loads(request.form['payload'])

    with open(os.path.join(DATA_DIR, get_current_filename()), 'a') as f:
        f.write(unicode(event))
        f.write('\n')

    return 'OK'


if __name__ == '__main__':
    app.run(host='0.0.0.0')

