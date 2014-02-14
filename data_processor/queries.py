import calendar
import datetime

from elasticutils import S

from es import ES


def make_datetime(utctime):
    return datetime.datetime.strptime(utctime,'%Y-%m-%dT%H:%M:%SZ')

def fit_time_range(start, end):
    """
    Keeps an empty time range empty. Stretches an incomplete
    time range.

    field can be 'created_at' or 'closed_at'
    """
    if start == None and end == None:
        return (None, None)
    if start == None:
        start = datetime.datetime(year=1970, month=1, day=1)
    if end == None:
        end = datetime.datetime.now()

    return (start, end)

def apply_time_filter(query, start, end, field='created_at'):
    start, end = fit_time_range(start, end)
    if start and end:
        if field == 'created_at':
            return query.filter(created_at__range=(start, end))
        elif field == 'closed_at':
            return query.filter(closed_at__range=(start, end))
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
                'value': query(index=index, start=start, end=end)
        }
        data.append(month_data)
    data.reverse()
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
    q = S().indexes(index).doctypes('IssuesEvent', 'IssueCommentEvent')
    q = apply_time_filter(q, start, end)
    return q.facet('payload.issue.number').facet_counts()['payload.issue.number']

def untouched_issues(index):
    """
    Open issues that haven't seen any action (updated_at == created_at).
    """
    issues = S().indexes(index).doctypes('IssueData') \
                .filter(state='open').values_dict()
    untouched = [i for i in list(issues) if i['updated_at'] == i['created_at']]
    return untouched

def issues_assigned_to(index, login):
    """
    List of open issues assigned to {{ login }}.
    """
    issues = S().indexes(index).doctypes('IssueData') \
                .filter(**{'assignee.login': login, 'state': 'open'}) \
                .values_dict()
    return list(issues)

def recent_events(index, count=200, starting_from=0):
    """
    Returns the <count> most recent events, starting from
    index <starting_from>.
    """
    q = S().indexes(index).order_by('-created_at')
    q = q[starting_from : starting_from + count]
    q = q.values_dict()
    return list(q)

def available_repos():
    EXCLUDED = ['kibana-int']
    # get all indices
    indices = ES.indices.get_aliases().keys()
    # filter out those that don't look as repos
    indices = [i for i in indices if len(i.split('-')) == 2]
    # there are some that still sneak by
    indices = [i for i in indices if i not in EXCLUDED]

    # format them as github repos (slashes)
    formatted = [i.replace('-', '/') for i in indices]
    return formatted

def issue_events_count(index, action, start=None, end=None):
    # action can be 'opened' or 'closed'
    q = S().indexes(index).doctypes('IssuesEvent')
    q = apply_time_filter(q, start, end)
    q = q.filter(**{'payload.action': action})
    return q.count()

def issues_count(index, state):
    # state can be 'open' or 'closed'
    q = S().indexes(index).doctypes('IssueData')
    q = q.filter(state=state)
    return q.count()

def pulls_count(index):
    # we only have open pull requests
    q = S().indexes(index).doctypes('PullRequestData')
    return q.count()

def inactive_issues(index):
    """
    Open issues that haven't seen any activity in the past 2 weeks.
    """
    now = datetime.datetime.now()
    limit = now - datetime.timedelta(weeks=2)
    issues = S().indexes(index).doctypes('IssueData') \
                .filter(state='open') \
                .filter(updated_at__lt=limit) \
                .values_dict()
    return list(issues)

def avg_issue_time(index, start=None, end=None):
    """
    Average time from opening until closing for issues in the given timeframe.
    """
    q = S().indexes(index).doctypes('IssueData').filter(state='closed')
    q = apply_time_filter(q, start, end, field='closed_at')
    issues = q.values_dict()

    sum = 0 # using seconds, int is fine
    count = 0
    for i in issues:
        start = make_datetime(i['created_at'])
        end = make_datetime(i['closed_at'])
        delta = end - start
        sum += delta.total_seconds()
        count += 1

    if not count:
        return 0
    return sum / count

def issues_involvement(index, start=None, end=None):
    """
    Dict mapping from issue number to {issue: issue_obj,
                                       users: [list of users_obj]}
    for events that happened during the <start, end> time period.
    """
    q = S().indexes(index).doctypes('IssuesEvent', 'IssueCommentEvent')
    q = apply_time_filter(q, start, end)

    issues = {}
    for event in q.values_dict():
        issue = event['payload']['issue']
        number = issue['number']
        user = event['actor']

        if number not in issues:
            issues[number] = {
                'issue': issue,
                'users': [user]
            }
            continue

        issues[number]['users'].append(user)

    return issues
