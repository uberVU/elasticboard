from data_processor.es import *
import sys

# python remove_repo.py ubervu/elasticboard

uri = sys.argv[1]
owner, repository = uri.split('/')
index_name = '%s-%s' % (owner, repository)
ES.indices.delete(index_name)
ES.transport.perform_request(url='/_river/%s' % index_name, method='DELETE')
print "Removed data and river for %s." % uri
