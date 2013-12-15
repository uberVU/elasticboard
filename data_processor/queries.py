from es import ES
from elasticutils import S

import datetime
import elasticsearch

def fit_time_range(start, end):
    """
    Keeps an empty time range empty. Stretches an incomplete
    time range.
    """
    if start == None and end == None:
        return (None, None)
    if start == None:
        start = datetime.datetime(year=1970, month=1, day=1)
    if end == None:
        end = datetime.datetime.now()

    return (start, end)

def apply_time_filter(query, start, end):
    start, end = fit_time_range(start, end)
    if start and end:
        return query.filter(created_at__range=(start, end))
    return query

def most_active_people(index, start=None, end=None):
    """
    Finds the most active users - as actors in all the events.
    -- index looks like "USER-REPO"

    Returns a list of dicts like:
    {'count': N, 'term': NAME}
    """
    q = S().indexes(index)
    q = apply_time_filter(q, start, end)
    return q.facet('actor.login').facet_counts()['actor.login']

def total_events(index, start=None, end=None):
    """
    Returns the number of total events for the given time
    interval, or for all the data if no interval is given.
    """
    q = S().indexes(index)
    q = apply_time_filter(q, start, end)
    return q.count()

