from functools import partial, wraps
import datetime
import queries

from utils import crossdomain
from flask import Flask, jsonify, request
from werkzeug.contrib.cache import MemcachedCache

cache = MemcachedCache(['127.0.0.1:11211'])
CACHE_TIMEOUT = 5 * 60
app = Flask(__name__)
# app.debug = True

CHART_MONTHS = 6

def index_name(user, repo):
    return '&'.join((user, repo))

@app.errorhandler(500)
def internal_error(error):
    return "Not found or bad request", 400

# http://flask.pocoo.org/docs/patterns/viewdecorators/#caching-decorator
def cached(timeout=CACHE_TIMEOUT, key='view/%s'):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache_key = key % request.full_path # using full path for get params
            rv = cache.get(cache_key)
            if rv is not None:
                return rv
            rv = f(*args, **kwargs)
            cache.set(cache_key, rv, timeout=timeout)
            return rv
        return decorated_function
    return decorator


# api endpoints that call the queries

@app.route('/<owner>/<repo>/most_active_people')
@crossdomain(origin='*')
@cached()
def most_active_people(owner, repo):
    index = index_name(owner, repo)
    data = queries.most_active_people(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/total_events_monthly')
@crossdomain(origin='*')
@cached()
def total_events_monthly(owner, repo):
    index = index_name(owner, repo)
    data = queries.past_n_months(index, queries.total_events, CHART_MONTHS)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/most_active_issues')
@crossdomain(origin='*')
@cached()
def most_active_issues(owner, repo):
    index = index_name(owner, repo)
    data = queries.most_active_issues(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/untouched_issues')
@crossdomain(origin='*')
@cached()
def untouched_issues(owner, repo):
    index = index_name(owner, repo)
    data = queries.untouched_issues(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/<login>/issues_assigned')
@crossdomain(origin='*')
@cached()
def issues_assigned_to(owner, repo, login):
    index = index_name(owner, repo)
    data = queries.issues_assigned_to(index, login)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/recent_events')
@crossdomain(origin='*')
@cached()
def recent_events(owner, repo):
    index = index_name(owner, repo)
    count = int(request.args.get('count', 200))
    starting_from = int(request.args.get('starting_from', 0))
    data = queries.recent_events(index, count, starting_from)
    return jsonify(data=data)

@app.route('/available_repos')
@crossdomain(origin='*')
def available_repos():
    data = sorted(queries.available_repos())
    return jsonify(data=data)

@app.route('/<owner>/<repo>/issues_activity')
@crossdomain(origin='*')
@cached()
def issues_activity(owner, repo):
    index = index_name(owner, repo)
    opened = queries.past_n_months(index, partial(queries.issue_events_count, action='opened'), CHART_MONTHS)
    closed = queries.past_n_months(index, partial(queries.issue_events_count, action='closed'), CHART_MONTHS)
    data = {'opened': opened, 'closed': closed}
    return jsonify(data=data)

@app.route('/<owner>/<repo>/issues_count')
@crossdomain(origin='*')
@cached()
def issues_count(owner, repo):
    index = index_name(owner, repo)
    open = queries.issues_count(index, 'open')
    closed = queries.issues_count(index, 'closed')
    data = {'open': open, 'closed': closed}
    return jsonify(data=data)

@app.route('/<owner>/<repo>/pulls_count')
@crossdomain(origin='*')
@cached()
def pulls_count(owner, repo):
    index = index_name(owner, repo)
    count = queries.pulls_count(index)
    data = {'open': count}
    return jsonify(data=data)

@app.route('/<owner>/<repo>/inactive_issues')
@crossdomain(origin='*')
@cached()
def inactive_issues(owner, repo):
    index = index_name(owner, repo)
    data = queries.inactive_issues(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/avg_issue_time')
@crossdomain(origin='*')
@cached()
def avg_issue_time(owner, repo):
    index = index_name(owner, repo)
    times = queries.past_n_months(index, queries.avg_issue_time, CHART_MONTHS)
    return jsonify(data=times)

@app.route('/<owner>/<repo>/issues_involvement')
@crossdomain(origin='*')
@cached()
def issues_involvement(owner, repo):
    index = index_name(owner, repo)
    now = datetime.datetime.now()
    month_start = now - datetime.timedelta(days=now.day)
    data = queries.issues_involvement(index, start=month_start, end=now)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/milestones')
@crossdomain(origin='*')
@cached()
def milestones(owner, repo):
    index = index_name(owner, repo)
    milestones = queries.milestones(index)
    return jsonify(data=milestones)

@app.route('/<owner>/<repo>/unassigned_issues')
@crossdomain(origin='*')
@cached()
def unassigned_issues(owner, repo):
    index = index_name(owner, repo)
    label = request.args.get('label', None)
    issues = queries.unassigned_issues(index, label)
    return jsonify(data=issues)

@app.route('/<owner>/<repo>/labels')
@crossdomain(origin='*')
@cached()
def labels(owner, repo):
    index = index_name(owner, repo)
    labels = queries.labels(index)
    return jsonify(data=labels)

if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True)
