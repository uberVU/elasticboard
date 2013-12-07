from es import ES

import elasticsearch

SIZE = 100

# queries go here
def most_active_people():
    body = {'query':
                {'match_all': {}},
            'facets':
                {'people': {
                    'terms': {
                        'field': 'actor.login',
                        'size': SIZE}}}}
    res = ES.search(body=body)
    return res['facets']['people']['terms']

