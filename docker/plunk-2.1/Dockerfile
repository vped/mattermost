# Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
# See License.txt for license information.
FROM ubuntu:14.04

WORKDIR /mattermost

# Copy over files
ADD ./dist/mattermost.tar.gz /
ADD ./docker/plunk-2.1/config_docker.json /
ADD ./docker/plunk-2.1/docker-entry.sh /

RUN chmod +x /docker-entry.sh
ENTRYPOINT /docker-entry.sh

# Create default storage directory
RUN mkdir /mattermost-data/

# Ports
EXPOSE 80
