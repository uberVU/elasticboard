import datetime
import gzip
import json
import os
import requests
import sys
import urllib
import re

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

def make_datetime(json_date):
    return datetime.datetime.strptime(json_date, '%Y-%m-%dT%H:%M:%SZ')

def parse_header_link(header):
    """
    '<https://api.github.com/repositories/2965476/events?page=2>; rel="next"'
    -> (url, 'next', 2)

    ugly - can't change the header, unfortunately
    """
    urlpage_rel = '\<(?P<url>[a-z/0-9:\.]+\?page=(?P<page>[0-9]{1,3}))\>;[\srel\=\"]+(?P<rel>[elnrxt]{1,3})'
    urlpage_rel_data = re.match(urlpage_rel, header).groupdict()
    page = int(urlpage_rel_data['page'])
    url = urlpage_rel_data['url']
    rel = urlpage_rel_data['rel']
    return (url, rel, page)

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
    url, rel, page = parse_header_link(response.headers['link'])
    # The page check is required to obey the github API event request
    # limitations when they fix it we should take this out.
    while rel != 'last' and page < 11: 
        response = requests.get(url, auth=auth)
        if not response.ok:
            fp.close()
            return False

        events = response.json()

        need_more = write_events_chunk(fp, events, newer_than=newer_than)
        if not need_more:
            break

        url, rel, page = parse_header_link(response.headers['link'])

    fp.close()
    return True

