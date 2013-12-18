import elasticsearch

INDEX_NAME = 'demo'

ES_NODE = {
    'host': 'localhost',
    'port': 9200,
}

ES = elasticsearch.Elasticsearch(hosts=[ES_NODE])

def index_events(event_list, index_name=INDEX_NAME):
    """
    Indexes the list of events in the given index. Events should
    have a "type" field to help bucketize them into different
    doctypes.

    -- index looks like "USER-REPO"
    """
    for ev in event_list:
        try:
            doc_type = ev['type'].lower()
        except:
            doc_type = 'generic'
        ES.index(index=index_name, doc_type=doc_type, body=ev)

