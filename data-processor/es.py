import elasticsearch

INDEX_NAME = 'demo'
DOC_TYPE = 'demo'

ES_NODE = {
    'host': 'localhost',
    'port': 9200,
}

es = elasticsearch.Elasticsearch(hosts=[ES_NODE])

def index_events(event_list):
    for ev in event_list:
        es.index(index=INDEX_NAME, doc_type=DOC_TYPE, body=ev)

