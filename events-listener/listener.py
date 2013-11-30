import datetime
import json
import os

from flask import Flask, request
from pprint import pprint
from threading import Lock


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
fs_lock = Lock()


@app.route('/', methods=['POST'])
def got_event():
    event = json.loads(request.form['payload'])

    fs_lock.acquire()
    with open(os.path.join(DATA_DIR, get_current_filename()), 'a') as f:
        f.write(unicode(event) + '\n')
    fs_lock.release()

    return 'OK'


if __name__ == '__main__':
    app.run(host='0.0.0.0')

