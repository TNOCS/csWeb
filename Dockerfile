FROM node:4

RUN useradd -ms /bin/bash node
ADD . /home/node/app
RUN chown -R node:node /home/node

RUN npm install -g npm
RUN npm install -g typescript@1.6.2 bower gulp node-gyp
RUN apt-get update && apt-get install -y libkrb5-dev

USER node
ENV HOME /home/node

EXPOSE 3002
WORKDIR /home/node/app
RUN npm install
RUN gulp init
WORKDIR /home/node/app/example
CMD node server.js
