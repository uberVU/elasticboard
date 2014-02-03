import json
import sys

from data_processor.es import ES
from elasticutils import S

f = open('config.json')
data = json.load(f)
f.close()

if 'repos' not in data:
    sys.exit()

for repo in data['repos']:
    owner = repo['owner']
    name = repo['repository']

    i = {
        'github': {
            'owner': owner,
            'repository': name,
            'interval': 3600,
        }
    }
    ES.index(index='_river', doc_type='github', body=i, id='%s-%s' % (owner, name))


