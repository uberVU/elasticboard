elasticboard
============

ElasticSearch dashboard


Prototype architecture:

The **dashboard** provides the user with data visualization. It gets all the
data it needs from the ElasticSearch service.

The **events-listener** listens for events sent from github for a given repo
(via hooks) and stores them as raw data.

The **data-processor** parses github archive and events-listener data and dumps
it to ElasticSearch.

