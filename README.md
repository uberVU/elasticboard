elasticboard
============

A dashboard that aggregates relevant metrics for Open Source projects. Helps with tracking status and evolution over time. Requires minimal set up and it's useful right away.


##Current status

The project is just getting started. We have the data ingestion part covered and we are currently using Kibana to explore the data in order the observe relevant patterns.

We are working on implementing [queries](https://github.com/uberVU/elasticboard/issues?labels=query&page=1&state=open) in order to provide relevant metrics.

##How you can help

Help us implement [queries](https://github.com/uberVU/elasticboard/issues?labels=query&page=1&state=open)! The [elasticsearch docs](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search.html), [existing code](https://github.com/uberVU/elasticboard/blob/master/data_processor/queries.py) and issue descriptions should help you get started. If you still need more info, please post a comment on the respective issue.

If you have an idea of a metric that is not covered in that list, please submit it on the [issue tracker](https://github.com/uberVU/elasticboard/issues).


##Prototype architecture

*Right now we support one repository per deployment.*

The **dashboard** provides the user with data visualization. It gets all the
data it needs from the ElasticSearch service. Right now this is fulfilled by
Kibana.

The **data_processor** parses raw data (from github archive, API or *events_listener*)
and stores it in ElasticSearch.

The **events_listener** listens for live events sent from github for a given repo
(via hooks) and stores them as raw data.


The data inside ElasticSearch is laid out as following - every repository get its own index, and event types are mapped to document types. Read more about it in [schema.md](https://github.com/uberVU/elasticboard/blob/master/schema.md).


##Bootstrapping - get some data

	$ pip install -r data_processor/requirements-pip
    $ python
    >>> from data_processor.es import index_events
    >>> from data_processor.lib import parse_events
    >>> events = parse_events('contrib/1k-lettuce-events')
    >>> index_events(events, index_name='gabrielfalcao-lettuce')


##Visually exploring the data

1.Start a webserver in `dashboard/kibana-latest`:

    cd PATH_TO_KIBANA; python -m SimpleHTTPServer


2.Point your browser to [http://localhost:8000](http://localhost:8000) (or whatever URL you are using).
If you don't know your way around kibana, use the guided dashboard: 
[http://localhost:8000/index.html#/dashboard/file/guided.json](http://localhost:8000/index.html#/dashboard/file/guided.json).

