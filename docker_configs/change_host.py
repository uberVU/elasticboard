import json
import sys

path = sys.argv[1]
f = open(path)
data = json.load(f)
f.close()

data['elasticsearch']['host'] = '127.0.0.1'
data['elasticsearch']['port'] = 9201

f = open(path, 'w')
json.dump(data, f, indent=2)
f.close()

