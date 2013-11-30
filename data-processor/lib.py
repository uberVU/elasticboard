import gzip
import json
import sys

from pprint import pprint

def parse_events(path, owner, name, gz=False):
    """
    Takes in a .json[.gz] file with one json entry per line and
    returns a list of events that match the given owner and
    repository name

    example file: http://data.githubarchive.org/2013-06-11-15.json.gz
    """

    events = []
    if gz:
        fopen = gzip.open
    else:
        fopen = open

    with fopen(path, 'rb') as f:
        json_line = f.readline()
        while json_line:
            obj = json.loads(json_line)
            json_line = f.readline()

            if 'repository' not in obj:
                continue

            if obj['repository']['owner'] == owner and\
               obj['repository']['name'] == name:
                events.append(obj)

    return events

