from functools import partial
import queries

from utils import crossdomain
from flask import Flask, jsonify, request

app = Flask(__name__)
app.debug = True

def index_name(user, repo):
    return '-'.join((user, repo))


# api endpoints that call the queries

@app.route('/<owner>/<repo>/most_active_people')
@crossdomain(origin='*')
def most_active_people(owner, repo):
    index = index_name(owner, repo)
    data = queries.most_active_people(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/total_events_monthly')
@crossdomain(origin='*')
def total_events_monthly(owner, repo):
    index = index_name(owner, repo)
    data = queries.past_n_months(index, queries.total_events, 6)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/most_active_issues')
@crossdomain(origin='*')
def most_active_issues(owner, repo):
    index = index_name(owner, repo)
    data = queries.most_active_issues(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/open_issues')
@crossdomain(origin='*')
def open_issues(owner, repo):
    index = index_name(owner, repo)
    data = queries.open_issues(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/issues_without_comments')
@crossdomain(origin='*')
def issues_without_comments(owner, repo):
    index = index_name(owner, repo)
    data = queries.issues_without_comments(index)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/<login>/issues_assigned')
@crossdomain(origin='*')
def issues_assigned_to(owner, repo, login):
    index = index_name(owner, repo)
    data = queries.issues_assigned_to(index, login)
    return jsonify(data=data)

@app.route('/<owner>/<repo>/recent_events')
@crossdomain(origin='*')
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
def issues_activity(owner, repo):
    index = index_name(owner, repo)
    opened = queries.past_n_months(index, partial(queries.issue_events_count, action='opened'), 6)
    closed = queries.past_n_months(index, partial(queries.issue_events_count, action='closed'), 6)
    data = {'opened': opened, 'closed': closed}
    return jsonify(data=data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True)

