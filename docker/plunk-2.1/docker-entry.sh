#!/bin/bash
# Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
# See License.txt for license information.

mkdir -p web/static/js

echo "127.0.0.1 dockerhost" >> /etc/hosts
/etc/init.d/networking restart

echo starting platform
cd /mattermost/bin
./platform -config=/config_docker.json
