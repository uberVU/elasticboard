import queries

from utils import crossdomain
from flask import Flask, jsonify

app = Flask(__name__)
app.debug = True

def index_name(user, repo):
    return '-'.join((user, repo))

# api endpoints that call the queries

@app.route('/<user>/<repo>/most_active_people')
@crossdomain(origin='*')
def most_active_people(user, repo):
    index = index_name(user, repo)
    data = queries.most_active_people(index)
    return jsonify(data=data)


if __name__ == '__main__':
    app.run()

