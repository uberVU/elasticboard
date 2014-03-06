from data_processor.es import *

count = 0
for repository in CONFIG['repositories']:
    repository['owner'] = repository['owner'].lower()
    repository['repository'] = repository['repository'].lower()
    body = {
        'type': 'github',
        'github': repository
    }
    index_name = '%s&%s' % (repository['owner'], repository['repository'])
    url = '/_river/%s/_meta' % index_name
    try:
        # delete it first if it already existed
        ES.transport.perform_request(url=url[:-5], method='DELETE')
    except Exception as e:
        pass
    ES.transport.perform_request(url=url, method='PUT', body=body)
    count += 1

print "Added/updated %d rivers." % count
