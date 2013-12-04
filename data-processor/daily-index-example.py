# this file is run by a cronjob

import datetime
import os
import sys
import tempfile

from lib import parse_events, dump_repo_events
from es import index_events

OWNER = "TODO"
REPO = "TODO"
API_USER = "TODO"
API_PASSWORD = "TODO"


DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)),
    'events-listener',
    'data'
))

def format_filename(dt):
    fmt = '%Y-%m-%d'
    return dt.strftime(fmt)

def index_received_events():
    """
    Indexes the live events received the day before.
    """
    yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
    filename = format_filename(yesterday)

    f = os.path.join(DATA_PATH, filename)

    if not os.path.exists(f):
        print >>sys.stderr, "Yesterday file does not exist (%s)." % f
        return False

    events = parse_events(f)
    index_events(events)
    return True

def index_api_events():
    """
    Indexes all the events github gives us for yesterday.
    """
    yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
    filename = '%s-%s-%s' % (OWNER, REPO, format_filename(yesterday))
    path = os.path.join(DATA_PATH, filename)

    dump_repo_events(path, owner=OWNER, repo=REPO, user=API_USER,
                     password=API_PASSWORD, newer_than=yesterday)
    events = parse_events(path)

    index_name = '%s-%s' % (OWNER, REPO)
    index_events(events, index_name=index_name)
    return True


if __name__ == '__main__':
    index_received_events()
    index_api_events()

