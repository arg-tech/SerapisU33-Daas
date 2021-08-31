FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
# ENV MONGO_HOST "host.docker.internal"
RUN npm install
COPY . .
EXPOSE 8075
CMD [ "node", "index.js" ]

