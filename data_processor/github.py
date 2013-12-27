import datetime
import gzip
import json
import os
import requests
import sys
import urllib

from pprint import pprint

def parse_events(path, gz=False, predicate=None):
    """
    Takes in a .json[.gz] file with one json entry per line and
    returns a list of events that match the given predicate or
    all of them if no predicate is given

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
            try:
                obj = json.loads(json_line)
            except:
                continue
            finally:
                json_line = f.readline()

            if predicate == None or predicate(obj):
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

def make_datetime(json_date):
    return datetime.datetime.strptime(json_date, '%Y-%m-%dT%H:%M:%SZ')

def parse_header_link(header):
    """
    '<https://api.github.com/repositories/2965476/events?page=2>; rel="next"'
    -> (url, 'next')

    ugly - can't change the header, unfortunately
    """
    url = header.split(';')[0][1:-1]
    rel = header.split(';')[1].split('=')[1][1:-1]
    return (url, rel)

def write_events_chunk(fp, events, newer_than=None):
    for ev in events:
        if 'payload' not in ev:
            continue
        if newer_than != None and make_datetime(ev['created_at']) < newer_than:
            return False
        fp.write(unicode(json.dumps(ev)) + '\n')
    return True

def dump_repo_events(path, owner, repo, newer_than=None, user='', password=''):
    """
    newer_than should be datetime.datetime
    """
    api_url = 'https://api.github.com/repos/%s/%s/events' % (owner, repo)
    auth = (user, password)

    fp = open(path, 'w')

    response = requests.get(api_url, auth=auth)
    if not response.ok:
        fp.close()
        return False

    write_events_chunk(fp, response.json(), newer_than=newer_than)
    url, rel = parse_header_link(response.headers['link'])

    while rel != 'last':
        response = requests.get(url, auth=auth)
        if not response.ok:
            fp.close()
            return False

        events = response.json()

        need_more = write_events_chunk(fp, events, newer_than=newer_than)
        if not need_more:
            break

        url, rel = parse_header_link(response.headers['link'])

    fp.close()
    return True

def dump_archive_events(owner, repo, path, count):
    """
    Looks in the gh archive for events matching owner/repo and downloads
    approx count events (might be a bit more than count).
    """
    interval = datetime.datetime.now()
    hour = datetime.timedelta(hours=1)

    def check(obj):
        if 'repository' not in obj:
            return False
        return obj['repository']['owner'] == owner and\
               obj['repository']['name'] == repo

    num = 0
    fp = open(path, 'w')
    while num < count:
        tmp = get_archive_data(interval)

        try:
            events = parse_events(tmp, gz=True, predicate=check)
        except IOError:
            # no data yet
            os.remove(tmp)
            interval -= hour
            continue

        for ev in events:
            fp.write(unicode(json.dumps(ev)) + '\n')
            num += 1

        os.remove(tmp)
        interval -= hour

        if events:
            print "Got %d/%d events." % (num, count)

    fp.close()

