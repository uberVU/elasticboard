import datetime
import gzip
import json
import sys
import urllib

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

def get_archive_data(hour):
    """
    Takes in a datetime.datetime object and returns
    a path on the local filesystem to the downloaded github archive
    raw file for the given hour.
    """

    # we don't support files before August 12, 2012
    # https://github.com/igrigorik/githubarchive.org/issues/9#issuecomment-7670455
    oldest = datetime.datetime(year=2012, month=8, day=12)
    if hour < oldest:
        raise ValueError("We don't support dates older than August 12, 2012.")

    url = "http://data.githubarchive.org/%4d-%02d-%02d-%d.json.gz"
    url = url % (hour.year, hour.month, hour.day, hour.hour)

    path, headers = urllib.urlretrieve(url)
    return path

