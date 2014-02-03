import elasticsearch
import json

INDEX_NAME = 'demo&demo'


with open('config.json') as f:
    CONFIG = json.load(f)


ES_NODE = {
    'host': CONFIG['elasticsearch']['host'],
    'port': CONFIG['elasticsearch']['port'],
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
            doc_type = ev['type']
        except:
            doc_type = 'generic'
        ES.index(index=index_name, doc_type=doc_type, body=ev)

def index_other(items, index_name=INDEX_NAME, doc_type='generic'):
    for item in items:
        ES.index(index=index_name, doc_type=doc_type, body=item)

