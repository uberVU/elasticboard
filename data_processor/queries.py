from es import ES
from elasticutils import S

import calendar
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

def past_n_months(index, query, n):
    """
    Maps a query over time intervals corresponding to the past n months.
    Returns a list of objects like {'month': name, 'data': query_data}.
    """
    data = []
    now = datetime.datetime.now()
    year = now.year
    month = now.month
    for i in range(n - 1, -1, -1):
        m = month - i
        start = datetime.date(year=year, month=m, day=1)
        last_day = calendar.monthrange(year, m)[1]
        end = datetime.date(year=year, month=m, day=last_day)

        month_data = {
                'month': start.strftime('%B'),
                'value': query(index, start, end)
        }
        data.append(month_data)
    return data

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

def most_active_issues(index, start=None, end=None):
    """
    Finds the most active issues - by total number of events.
    """
    q = S().indexes(index).doctypes('issuesevent', 'issuecommentevent')
    q = apply_time_filter(q, start, end)
    return q.facet('payload.issue.number').facet_counts()['payload.issue.number']

