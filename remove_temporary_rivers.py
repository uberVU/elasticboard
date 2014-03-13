from data_processor.queries import *
import sys
import time

# python remove_temporary_rivers.py [--all]

LIFETIME = 3600 # one hour

REMOVE_ALL = False
if len(sys.argv) == 2 and sys.argv[1] == '--all':
    REMOVE_ALL = True

rivers = S().indexes('_river') \
    .filter(type='github') \
    .values_dict()
rivers = all(rivers)

for river in rivers:
    if 'temporary' in river:
        ctime = river['created_at']
        now = time.time()
        if REMOVE_ALL or (now - ctime > LIFETIME):
            owner = river['github']['owner']
            repository = river['github']['repository']
            index_name = '%s&%s' % (owner, repository)
            try:
                ES.transport.perform_request(url='/_river/%s' % index_name, method='DELETE')
            except:
                pass
            time.sleep(3)
            try:
                ES.indices.delete(index_name)
            except:
                pass
            print "Removed %s/%s" % (owner, repository)

