from es import ES
from elasticutils import S

import calendar
import datetime
import elasticsearch
import sys


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
    for i in range(n):
        month = month - 1
        # handle first months of the year special case
        if  month == 0:
            month = 12
            year -= 1
        start = datetime.date(year=year, month=month, day=1)
        last_day = calendar.monthrange(year, month)[1]
        end = datetime.date(year=year, month=month, day=last_day)

        month_data = {
                'month': start.strftime('%B'),
                'value': query(index, start, end)
        }
        data.append(month_data)
    return data

def facet_counts_all(query, field):
    """
    Returns the facet counts for the equivalent .facet(field) query
    but grabs all the results (size = big).
    """
    # https://github.com/mozilla/fjord/blob/master/fjord/analytics/views.py#L527
    ALL = 2**31 - 1 # es/java maxint
    facet = {
        'terms': {
            'field': field,
            'size': ALL
        }
    }
    q = query._build_query()
    if 'filter' in q:
        facet['facet_filter'] = q['filter']

    return query.facet_raw(f=facet).facet_counts()['f']

def most_active_people(index, start=None, end=None):
    """
    Finds the most active users - as actors in all the events.

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

def open_issues(index):
    """
    All open issues - even reopened ones.
    """
    # get all opened issues
    q = S().indexes(index).doctypes('issuesevent')
    opened = q.filter(**{'payload.action': 'opened'})
    issues = [i['payload']['issue']['number'] for i in opened.all()]
    issues = set(issues)

    # for every issue, find the latest event and see if it's closed
    # we have to do this because an issue can be opened and reopened
    # multiple times
    to_remove = set()
    for issue in issues:
        events = q.filter(**{'payload.issue.number': issue})
        events = events.order_by('-payload.issue.updated_at')[:1]
        action = [e['payload']['action'] for e in events][0]
        if action == 'closed':
            to_remove.add(issue)
    issues -= to_remove

    return list(issues)

def issues_without_comments(index):
    """
    Open issues with no comments.
    """
    # todo - facet count needs to be bigger than 10
    issues = open_issues(index)

    with_comments = S().indexes(index).doctypes('issuecommentevent')
    with_comments = facet_counts_all(with_comments, 'payload.issue.number')
    with_comments = [r['term'] for r in with_comments]

    return list(set(issues) - set(with_comments))

def issues_assigned_to(index, login):
    """
    List of open issues assigned to {{ login }}.
    """
    q = S().indexes(index).doctypes('issuesevent', 'issuecommentevent')
    assigned = q.filter(**{'payload.issue.assignee.login': login})
    assigned = facet_counts_all(assigned, 'payload.issue.number')
    assigned = [r['term'] for r in assigned]

    # keep open ones
    issues = open_issues(index)
    return list(set(assigned).intersection(set(issues)))

