import elasticsearch

INDEX_NAME = 'demo'
DOC_TYPE = 'demo'

ES_NODE = {
    'host': 'localhost',
    'port': 9200,
}

es = elasticsearch.Elasticsearch(hosts=[ES_NODE])

def index_events(event_list, index_name=INDEX_NAME, doc_type=DOC_TYPE):
    for ev in event_list:
        es.index(index=index_name, doc_type=doc_type, body=ev)

