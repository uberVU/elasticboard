#!/bin/bash

sudo service elasticsearch start
sudo service nginx start

cd /home/elasticboard

echo "Waiting for Elasticsearch to start.."
bash -c 'until sudo netstat -tpln | grep 9200 &> /dev/null; do sleep 2; done'

python init_rivers.py

/usr/local/bin/gunicorn -k eventlet -w 4 -b 0.0.0.0:5000 data_processor.api:app

