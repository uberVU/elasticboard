# this file is run by a cronjob

import datetime
import os
import sys

from lib import parse_events
from es import index_events

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)),
    'events-listener',
    'data'
)

def format_filename(dt):
    fmt = '%Y-%m-%d'
    return dt.strftime(fmt)


if __name__ == '__main__':
    yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
    filename = format_filename(yesterday)

    data_dir = os.path.abspath(DATA_PATH)
    f = os.path.join(data_dir, filename)

    if not os.path.exists(f):
        print >>sys.stderr, "Yesterday file does not exist (%s)." % f
        sys.exit()

    events = parse_events(f)
    index_events(events)

    print "Indexed %d events." % len(events)

