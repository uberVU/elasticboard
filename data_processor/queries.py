from es import ES
from elasticutils import S

import datetime
import elasticsearch

SIZE = 100
DATEFORMAT = '%Y-%m-%dT%H:%M:%SZ'

def fit_time_range(start, end):
    if start == None and end == None:
        return (None, None)
    if start == None:
        start = datetime.datetime(year=1970, month=1, day=1)
    if end == None:
        end = datetime.datetime.now()

    return (start, end)

def most_active_people(index, start=None, end=None):
    """
    Finds the most active users - as actors in all the events.
    Returns a list of dicts like:
    {'count': N, 'term': NAME}
    """
    q = S().indexes(index)

    start, end = fit_time_range(start, end)
    if start and end:
        q = q.filter(created_at__range=(start, end))

    return q.facet('actor.login').facet_counts()['actor.login']

