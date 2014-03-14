# Should be run like this (from the repo root):
# sudo docker run -v `pwd`:/home/elasticboard -p 8080:80 -p 5000:5000 -i -t elasticboard
#                                                ^^^^       ^^^^
#                                            you can change these

FROM dockerfile/java

RUN apt-get update
RUN apt-get install -y nginx-full python python-pip python-dev
RUN apt-get install -y bash

# from dockerfile/elasticsearch
# Install ElasticSearch.
RUN wget -O - http://packages.elasticsearch.org/GPG-KEY-elasticsearch | apt-key add -
RUN echo "deb http://packages.elasticsearch.org/elasticsearch/1.0/debian stable main" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y elasticsearch

ADD data_processor/requirements-pip /tmp/requirements-pip
RUN pip install -r /tmp/requirements-pip

# Prevent elasticsearch calling `ulimit`.
RUN sed -i 's/MAX_OPEN_FILES=/# MAX_OPEN_FILES=/g' /etc/init.d/elasticsearch

EXPOSE 80 5000

RUN /usr/share/elasticsearch/bin/plugin -i com.ubervu/elasticsearch-river-github/1.6.3

# copy nginx configs
ADD docker_configs/dashboard /etc/nginx/sites-available/dashboard
RUN ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard
RUN rm /etc/nginx/sites-enabled/default

RUN /usr/sbin/useradd --create-home --shell /bin/bash elasticboard
ADD docker_configs/sudoers /etc/sudoers
RUN chmod 440 /etc/sudoers
RUN chown root:root /etc/sudoers

ADD docker_configs/start.sh /bin/start.sh

USER elasticboard

# fire away
ENTRYPOINT ["/bin/start.sh"]

