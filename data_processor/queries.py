import calendar
import datetime

from es import ES, ES_NODE, CONFIG
from elasticutils import S as _S

class S(_S):
    def __call__(self):
        return _S().es(urls=['http://%s:%d' % (ES_NODE['host'], ES_NODE['port'])])

    def order_by(self, *args, **kwargs):
        """
        Doesn't allow the user to call order_by on an empty set.
        """
        if not self.count():
            return self
        return _S.order_by(self, *args, **kwargs)

# for queries where it makes sense
LIMIT = 20


def all(query):
    count = query.count()
    return query[:count]

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
            return query.filter(created_at__range=(start, end)), True
        elif field == 'closed_at':
            return query.filter(closed_at__range=(start, end)), True
    return query, False

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
        start = datetime.datetime(year=year, month=month, day=1, hour=0, minute=0)
        last_day = calendar.monthrange(year, month)[1]
        end = datetime.datetime(year=year, month=month, day=last_day, hour=23, minute=59)

        month_data = {
            'month': start.strftime('%B'),
            'value': query(index=index, start=start, end=end)
        }
        data.append(month_data)
    data.reverse()
    return data

def past_n_weeks(index, query, n):
    """
    Maps a query over time intervals corresponding to the past n months.
    Returns a list of objects like
    {'weekStart': Month1 day1, 'weekEnd': Month2 day2, 'data': query_data}.
    """
    # find the closest past Sunday
    end = datetime.datetime.now()
    while end.weekday() != 6:
        end -= datetime.timedelta(days=1)

    end.replace(hour=23, minute=59)
    start = end - datetime.timedelta(days=6)
    start.replace(hour=0, minute=0)

    data = []
    for i in range(n):
        week_data = {
            'weekStart': '%s %s' % (start.strftime('%B'), start.day),
            'weekEnd': '%s %s' % (end.strftime('%B'), end.day),
            'value': query(index=index, start=start, end=end)
        }
        data.append(week_data)

        start -= datetime.timedelta(days=7)
        end -= datetime.timedelta(days=7)

    data.reverse()
    return data

def most_active_people(index, start=None, end=None):
    """
    Finds the 10 most active users - as actors in all the events,
    and the event counts.

    Returns a list of dicts like:
     {'events': {u'watchevent': 1}, 'login': u'someone'},
    """
    q = S().indexes(index)
    q, filtered = apply_time_filter(q, start, end)
    people = q.facet('actor.login', size=10, filtered=filtered).facet_counts()['actor.login']
    people = [p['term'] for p in people]

    data = []
    for p in people:
        events = S().indexes(index)
        events, _ = apply_time_filter(q, start, end)
        events = events \
            .filter(**{'actor.login': p}) \
            .facet('type', size=100, filtered=True).facet_counts()['type']

        counts = {}
        for c in events:
            counts[c['term']] = c['count']
        data.append({
            'login': p,
            'events': counts
        })

    return data

def total_events(index, start=None, end=None):
    """
    Returns the number of total events for the given time
    interval, or for all the data if no interval is given.

    * they are grouped by event type, like:
    {
        "createevent": 11,
        "issuecommentevent": 32,
        "issuesevent": 15,
        "pushevent": 29,
        "total": 98,
        "watchevent": 11
      }
    """
    q = S().indexes(index)
    q, filtered = apply_time_filter(q, start, end)
    q = q.facet('type', size=100, filtered=filtered).facet_counts()['type']
    counts = {}
    for c in q:
        counts[c['term']] = c['count']
    return counts

def most_active_issues(index, start=None, end=None):
    """
    Finds the 10 most active open issues - by total number of events.
    """
    q = S().indexes(index).doctypes('IssuesEvent', 'IssueCommentEvent')
    q, filtered = apply_time_filter(q, start, end)
    counts = q.facet('payload.issue.number', filtered=filtered, size=1000).facet_counts()['payload.issue.number']

    # keep only open issues
    open_issues = S().indexes(index).doctypes('IssueData') \
        .filter(state='open') \
        .values_dict()
    open_issues = [i['number'] for i in all(open_issues)]

    active_issues = [i for i in counts if i['term'] in open_issues]
    return active_issues[:10]

def untouched_issues(index, label):
    """
    Open issues that haven't seen any action (updated_at == created_at).
    max LIMIT results
    """
    issues = S().indexes(index).doctypes('IssueData') \
                .filter(state='open').values_dict()
    issues = all(issues)

    if label:
        # filter out the ones that don't have {label} as a label
        new_q = []
        for issue in issues:
            for label_item in issue['labels']:
                if label_item['name'] == label:
                    new_q.append(issue)
                    break
        issues = new_q

    untouched = [i for i in list(issues) if i['updated_at'] == i['created_at']]
    untouched = untouched[:LIMIT]

    return untouched

def recent_events(index, count=200, starting_from=0):
    """
    Returns the <count> most recent events, starting from
    index <starting_from>.
    """
    q = S().indexes(index)
    q = q.order_by('-created_at')
    q = q[starting_from : starting_from + count]
    q = q.values_dict()
    return list(q)

def available_repos():
    EXCLUDED = ['kibana-int']
    # get all indices
    aliases = ES.indices.get_aliases()
    indices = aliases.keys()

    # backward compatibility - add aliases as well in there
    # (for old '-' indexes)
    extra_indices = []
    for name in indices:
        aliases_dict = aliases[name]
        # add aliases to the list
        extra_indices.extend(aliases_dict['aliases'].keys())
    indices.extend(extra_indices)

    # filter out those that don't look as repos
    indices = [i for i in indices if len(i.split('&')) == 2]
    # there are some that still sneak by
    indices = [i for i in indices if i not in EXCLUDED]

    # format them as github repos (slashes)
    formatted = [i.replace('&', '/') for i in indices]
    return formatted

def issue_events_count(index, action, start=None, end=None):
    # action can be 'opened' or 'closed'
    q = S().indexes(index).doctypes('IssueData')

    if action == 'opened':
        field = 'created_at'
    else:
        field = 'closed_at'
        q = q.filter(state='closed')
    q, filtered = apply_time_filter(q, start, end, field)

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

def inactive_issues(index, label):
    """
    Open issues that haven't seen any activity in the past 2 weeks.
    max LIMIT results
    """
    now = datetime.datetime.now()
    limit = now - datetime.timedelta(weeks=2)
    issues = S().indexes(index).doctypes('IssueData') \
                .filter(state='open') \
                .filter(updated_at__lt=limit) \
                .values_dict()

    issues = all(issues)
    if label:
        # filter out the ones that don't have {label} as a label
        new_q = []
        for issue in issues:
            for label_item in issue['labels']:
                if label_item['name'] == label:
                    new_q.append(issue)
                    break
        issues = new_q

    issues = issues[:LIMIT]

    if label:
        # filter out the ones that don't have {label} as a label
        new_q = []
        for issue in issues:
            for label_item in issue['labels']:
                if label_item['name'] == label:
                    new_q.append(issue)
                    break
        issues = new_q

    return list(issues)

def avg_issue_time(index, start=None, end=None):
    """
    Average time from opening until closing for issues in the given timeframe.
    """
    q = S().indexes(index).doctypes('IssueData').filter(state='closed')
    q, filtered = apply_time_filter(q, start, end, field='closed_at')
    issues = q.values_dict()
    issues = all(issues)

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
    ! only for the 10 most popular during this time period
    """
    q = S().indexes(index).doctypes('IssuesEvent', 'IssueCommentEvent')
    q, filtered = apply_time_filter(q, start, end)
    q = all(q)

    active_issues = most_active_issues(index, start, end)
    # only top 5 issues
    active_issues = [i['term'] for i in active_issues][:5]

    issues = {}
    added_users = {} # scratch dict to keep track of duplicate users
    for event in q.values_dict():
        issue = event['payload']['issue']
        number = issue['number']
        user = event['actor']

        if number not in active_issues:
            continue

        if number not in issues:
            issues[number] = {
                'issue': issue,
                'users': [user]
            }
            added_users[number] = set()
            added_users[number].add(user['login'])
            continue

        if user['login'] not in added_users[number]:
            issues[number]['users'].append(user)
            added_users[number].add(user['login'])

    return issues

def milestones(index):
    q = S().indexes(index).doctypes('MilestoneData') \
        .filter(open_issues__gt=0) \
        .values_dict()
    q = all(q)
    return list(q)

def unassigned_issues(index, label=None):
    """
    Open issues that are assigned to nobody.
    max LIMIT results.
    """
    # A pull request can be an issue too so we need to remove those
    q = S().indexes(index).doctypes('IssueData') \
        .filter(state='open') \
        .filter(pull_request=None) \
        .filter(assignee=None) \
        .values_dict()
    q = all(q)

    if label:
        # filter out the ones that don't have {label} as a label
        new_q = []
        for issue in q:
            for label_item in issue['labels']:
                if label_item['name'] == label:
                    new_q.append(issue)
                    break
        q = new_q

    q = q[:LIMIT]
    return list(q)

def labels(index):
    q = S().indexes(index).doctypes('LabelData').values_dict()
    q = all(q)
    return list(q)

def outstanding_pull_requests(index, limit=20):
    """
    Open pull requests that should be actioned.
    * there were no events - fresh opened PR
    * last event is by the PR initiator
    * [or, when that is not true] PR's updated_at timestamp
      is newer than the latest event found
      (means that some code was updated)
    """
    prs = []

    q = S().indexes(index).doctypes('PullRequestData') \
        .order_by('updated_at') \
        .values_dict()
    q = all(q)

    for pr in q:
        if len(prs) == limit:
            break

        number = pr['number']
        login = pr['user']['login']

        # find the most recent event related to this PR

        # might be a IssueComment event
        q1 = S().indexes(index).doctypes('IssueCommentEvent') \
                .filter(**{'payload.issue.number': number}) \
                .order_by('-created_at') \
                .values_dict()
        try:
            comment = q1[0]
        except:
            comment = None

        # or a PullRequestReviewCommentEvent
        q2 = S().indexes(index).doctypes('PullRequestReviewCommentEvent') \
                .filter_raw({
                    'regexp': {
                        'payload.comment.pull_request_url': '.*%d' % number
                    }
                }) \
                .order_by('-created_at') \
                .values_dict()
        try:
            review = q2[0]
        except:
            review = None

        # find which one between the two is the latest event
        latest = comment or review
        if comment and review:
            ts_comment = make_datetime(comment['created_at'])
            ts_review = make_datetime(review['created_at'])
            latest = comment if ts_comment > ts_review else review

        # if there's no event then there's definitely a need to review the PR
        if not latest:
            pr['last_activity'] = pr['updated_at']
            prs.append(pr)
            continue

        # if the last event is by the PR initiator, need to review
        if latest['actor']['login'] == login:
            pr['last_activity'] = latest['created_at']
            prs.append(pr)
        # maybe there was a comment made and the initiator updated the code
        else:
            if make_datetime(pr['updated_at']) > make_datetime(latest['created_at']):
                pr['last_activity'] = pr['updated_at']
                prs.append(pr)

    return prs

def popularity_events(index, start=None, end=None):
    q1 = S().indexes(index).doctypes('ForkEvent')
    q1, _ = apply_time_filter(q1, start, end)

    q2 = S().indexes(index).doctypes('WatchEvent')
    q2, _ = apply_time_filter(q2, start, end)

    counts = {
        'forks': q1.count(),
        'stars': q2.count()
    }
    return counts

def collaborators(index):
    q = S().indexes(index).doctypes('CollaboratorData').values_dict()
    q = all(q)
    return list(q)
