elasticboard
============

http://elasticboard.mihneadb.net/landing.html

Dashboard providing an easy way to track a GitHub repo's evolution. There's a timeline to quickly bring you up to
speed, graphs to view aggregated statistics and useful insights
so that you never miss an issue again.

You can view an example dashboard
[here](http://elasticboard.mihneadb.net/#/gabrielfalcao/lettuce).

##Setting it up

###Config file

First, you need to set up your config file:

    cp example_config.json config.json

Add the repository(ies) that interest you. The syntax is the following:

```json
{
    "owner": "facebook",
    "repository": "react",
    "interval": 3600,
    "authentication": {
        "username": "SOMEUSER",
        "password": "SOMEPASS"
    }
}
```

Note that the authentication part is optional (helps with the API rate limit
and private repositories).

###Deploy with docker

1. Download and run the docker image:

    ```sudo docker run -v `pwd`:/home/elasticboard -p 8080:80 -p 5000:5000 -i mihneadb/elasticboard /bin/start.sh```

2. There is no step 2. You now have elasticboard running at
[http://localost:8080](http://localhost:8080).


###Manual deploy


Make sure you have an [elasticsearch](http://www.elasticsearch.org/download)
instance accessible.

You also have to install the necessary Python dependencies:

```bash
# probably in a virtualenv
pip install -r data_processor/requirements-pip
```

Install the GitHub [river](https://github.com/uberVU/elasticsearch-river-github). (link has instructions)


Run the `init_rivers.py` file to load the rivers inside elasticsearch (make sure you
installed the python dependencies):

```bash
python init_rivers.py
```

Fire up the API server:

	gunicorn -k eventlet -w 4 -b 0.0.0.0:5000 data_processor.api:app


Serve the dashboard:

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

The **dashboard** takes care of the visualization aspect.

The **data_processor** is where all querying happens. It accesses data stored in
elasticsearch using [elasticutils](http://elasticutils.readthedocs.org/en/latest/)
and exposes the results through a simple API server that the dashboard calls.

Data flows directly into elasticsearch through the
[GitHub river](https://github.com/uberVU/elasticsearch-river-github).
