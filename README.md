elasticboard
============

Dashboard that aggregates relevant metrics for Open Source projects. Helps with tracking status and evolution over time. Requires minimal setup and it's useful right away.


##Current status

The project is just getting started. We have the data ingestion part covered
and we are currently using Kibana to explore the data in order the
observe relevant patterns and build a custom dashboard.

We are working on implementing
[queries](https://github.com/uberVU/elasticboard/issues?labels=query&page=1&state=open)
in order to provide relevant metrics.

##How you can help

Help us implement
[queries](https://github.com/uberVU/elasticboard/issues?labels=query&page=1&state=open)!
We are using the friendly
[elasticutils](http://elasticutils.readthedocs.org/en/latest/) library for this.
The
[existing code](https://github.com/uberVU/elasticboard/blob/master/data_processor/queries.py)
and issue descriptions should help you get started. If you need more
info, please post a comment on the respective issue.

If you have an idea of a metric that is not covered in that list,
please submit it on the [issue tracker](https://github.com/uberVU/elasticboard/issues).


##Prototype architecture

The **dashboard** provides the user with data visualization. It gets all the
data it needs from the elasticsearch service. We are working on building
our own dashboard, but in the meantime you can also explore the data using
Kibana.

The **data_processor** is where all querying happens. It accesses data stored in
elasticsearch using [elasticutils](http://elasticutils.readthedocs.org/en/latest/)
and exposes the results through a simple API server that the dashboard calls.

Data flows directly into elasticsearch through the
[GitHub river](https://github.com/uberVU/elasticsearch-river-github).

The data inside elasticsearch is laid out as following - every repository gets
its own index, and event types are mapped to document types. Read more
about it in [schema.md](https://github.com/uberVU/elasticboard/blob/master/schema.md).


##Bootstrapping

Make sure you have [elasticsearch](http://www.elasticsearch.org/download)
up and running on the default 9200 port.

###Get some data

	$ # probably in a virtualenv
	$ pip install -r data_processor/requirements-pip
    $ python
    >>> from data_processor.es import index_events
    >>> from data_processor.github import parse_events
    >>> events = parse_events('contrib/lettuce-events')
    >>> index_events(events, index_name='gabrielfalcao-lettuce')


###Fire up the API server

Run `data_processor/api.py`:

	python data_processor/api.py

This will start the API server listening on `127.0.0.1:5000`.

###Serve the dashboard

Start a webserver in `dashboard`:

    cd dashboard; python -m SimpleHTTPServer

Point your browser to [http://localhost:8000](http://localhost:8000)
(or whatever URL you are using). You'll see the current version of the
dashboard. If you want to visually explore the data, there's also a link
to Kibana on that page.
