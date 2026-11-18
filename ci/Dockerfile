# Local-only Jenkins controller for CloudOps Sentinel (INT 378)
# Adds the Docker CLI so pipeline stages can build/scan/run real local containers.
FROM jenkins/jenkins:lts-alpine

USER root
RUN apk add --no-cache --update \
        docker-cli \
        curl \
        git \
        bash \
    && rm -rf /var/cache/apk/*

# The Jenkins home volume preserves configuration and job definitions across rebuilds.
USER jenkins
