elasticboard
============

ElasticSearch dashboard for github repository statistics.


##Prototype architecture:

The **dashboard** provides the user with data visualization. It gets all the
data it needs from the ElasticSearch service. Right now this is fulfilled by
Kibana.

The **events-listener** listens for live events sent from github for a given repo
(via hooks) and stores them as raw data.

The **data-processor** parses raw data (from github archive, API or events-listener)
and stores it in ElasticSearch.


##Bootstrapping - get some data

    $ cd data-processor
    $ python
    >>> from es import *
    >>> from lib import *
    >>> events = parse_events('../contrib/1k-lettuce-events')
    >>> index_events(events, index_name='gabrielfalcao-lettuce')


##Visually exploring the data

1. Start a webserver in `dashboard/kibana-latest`:

    `cd PATH_TO_KIBANA; python -m SimpleHTTPServer`


2. Point your browser to `http://localhost:8000` (or whatever URL you are using).
If you don't know your way around kibana, use the guided dashboard:
`http://localhost:8000/index.html#/dashboard/file/guided.json`

