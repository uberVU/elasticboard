import elasticsearch

INDEX_NAME = 'demo'

ES_NODE = {
    'host': 'localhost',
    'port': 9200,
}

ES = elasticsearch.Elasticsearch(hosts=[ES_NODE])

def index_events(event_list, index_name=INDEX_NAME):
    for ev in event_list:
        try:
            doc_type = ev['type'].lower()
        except:
            doc_type = 'generic'
        ES.index(index=index_name, doc_type=doc_type, body=ev)

