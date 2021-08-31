# Dialogue as a Service (DaaS)

## Running the middleware
To run the software, enter the api directory, and run the command:
```
docker-compose up
```


## Running the chatbot website
Enter the chatbot_website directory and run the following command.

If _http-server_ is not installed:
```
npm i http-server
```

then
```
http-server
```

The website can be accessed at the default http-server url (typically http://localhost:8080/) and will call the DaaS middleware at http://localhost:8075/