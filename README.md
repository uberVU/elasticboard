elasticboard
============

Dashboard providing an easy way to track a GitHub repo's evolution. There's a timeline to quickly bring you up to
speed, graphs to view aggregated statistics and useful insights
so that you never miss an issue again.

You can view a running demo at
[http://elasticboard.mihneadb.net/#/gabrielfalcao/lettuce](http://elasticboard.mihneadb.net/#/gabrielfalcao/lettuce).

##Setting it up

Make sure you have an [elasticsearch](http://www.elasticsearch.org/download)
instance accessible.

Copy over your own config file and set the proper elasticsearch options.

    cp example_config.json config.json

You also have to install the necessary Python dependencies:

```bash
# probably in a virtualenv
pip install -r data_processor/requirements-pip
```

###Get some data

There are **two options** here - if you want just a quick demo, you can start off
with some *sample* data, like this:

    $ python
    >>> from data_processor.es import index_events, index_issues
    >>> from data_processor.github import parse_json_file
    >>> events = parse_json_file('contrib/lettuce-events')
    >>> index_events(events, index_name='gabrielfalcao&lettuce')
    >>> issues = parse_json_file('contrib/lettuce-issues')
    >>> index_other(issues, index_name='gabrielfalcao&lettuce', doc_type='IssueData')
    >>> pulls = parse_json_file('contrib/lettuce-pulls')
    >>> index_other(pulls, index_name='gabrielfalcao&lettuce', doc_type='PullRequestData')

**Otherwise**, we suggest you use the GitHub [river](https://github.com/uberVU/elasticsearch-river-github)
so you can always have up-to-date data. After installing the river plugin, feel free to add
the repositories that interest you in the `config.json` file.

You can also add authentication
data in there, if you want to access private repos or to make more requests:

```json
{
    "owner": "scala",
    "repository": "scala",
    "interval": 3600,
    "authentication": {
        "username": "SOMEUSER",
        "password": "SOMEPASS"
    }
}
```

After setting up `config.json`, just run the `init_rivers.py` file (make sure you
installed the dependencies):

```bash
python init_rivers.py
```

###Fire up the API server

	gunicorn -k eventlet -w 4 -b 0.0.0.0:5000 data_processor.api:app


###Serve the dashboard

Start a webserver in `dashboard`:

    cd dashboard; python -m SimpleHTTPServer

Point your browser to [http://localhost:8000](http://localhost:8000)
(or whatever URL you are using) and you are good to go!


##Current status

Working prototype. We have the timeline and some graphs.

We are working on implementing
[queries](https://github.com/uberVU/elasticboard/issues?labels=query&page=1&state=open) and [insights](https://github.com/uberVU/elasticboard/wiki/Insights)
in order to provide relevant information.

##How you can help

Help us implement
[queries](https://github.com/uberVU/elasticboard/issues?labels=query&page=1&state=open) and [insights](https://github.com/uberVU/elasticboard/wiki/Insights)!
We are using the friendly
[elasticutils](http://elasticutils.readthedocs.org/en/latest/) library for this.
The
[existing code](https://github.com/uberVU/elasticboard/blob/master/data_processor/queries.py)
and issue descriptions should help you get started. If you need more
info, please post a comment on the respective issue.

If you have an idea of a metric that is not covered in that list,
please submit it on the [issue tracker](https://github.com/uberVU/elasticboard/issues).


##Architecture

The **dashboard** takes care of the visualization aspect. You can even
use the embedded Kibana instance to manually explore the data.

The **data_processor** is where all querying happens. It accesses data stored in
elasticsearch using [elasticutils](http://elasticutils.readthedocs.org/en/latest/)
and exposes the results through a simple API server that the dashboard calls.

Data flows directly into elasticsearch through the
[GitHub river](https://github.com/uberVU/elasticsearch-river-github).
