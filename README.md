elasticboard
============

ElasticSearch dashboard for github repository statistics.


Prototype architecture:

The **dashboard** provides the user with data visualization. It gets all the
data it needs from the ElasticSearch service.

The **events-listener** listens for events sent from github for a given repo
(via hooks) and stores them as raw data.

The **data-processor** parses github archive and events-listener data and dumps
it to ElasticSearch.


How to set up the demo:

First, make sure you have elasticsearch running on `localhost:9200` (default).

If you want daily, from-your-repo, data:

1. Start the event listener by running `events-listener/listener.py`
2. Add a web hook to the github project - use `subscribe_web_hook` from
`events-listener/subscribe.py`
3. Add a daily cron job like the one in `data-processor/daily-cron`.

If you want to bootstrap yourself with some data from the
[github archive](http://www.githubarchive.org/):

    # using code from data-processor
    from lib import parse_events, get_archive_data
    from es import index_events

    hour = datetime.datetime(year=2013, month=7, day=5, hour=16)
    dld_path = get_archive_data(hour)

    events = parse_events(path=dld_path, gz=True)
    # you can even filter them with a predicate function
    # events = parse_events(path=dld_path, gz=True, predicate=lambda obj: obj['repository']['name'] == 'jquery')

    # now dump the data into es
    index_events(events)


Now fire up kibana and check out the data:

1. Start a webserver in `dashboard/kibana-3.0.0milestone4`:

    cd PATH_TO_KIBANA; python -m SimpleHTTPServer

2. Point your browser to `http://localhost:8000` (or whatever URL you are using).
If you don't know your way around kibana, use the guided dashboard:
`http://localhost:8000/index.html#/dashboard/file/guided.json`

