"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const superagent = require("superagent");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

function Location(city, geoData) {
  // console.log('DATA IS: ' + geoData.body.results);
  // console.log('CITY IS: ' + city);
  this.search_query = city;
  this.formatted_address = geoData.body.results[0].formatted_address;
  this.latitude = Number(geoData.body.results[0].geometry.location.lat);
  this.longitude = Number(geoData.body.results[0].geometry.location.lng);
}

function Forecast(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Event(event) {
  this.link = event.url;
  this.name = event.name.text;
  this.event_date = new Date(event.start.local).toString().slice(0, 15);
  this.summary = event.summary;
}
// app.use(express.static("./public"));
app.use(cors());

// Respond to GET requests from client
app.get("/location", searchLatLong);
app.get("/weather", getWeather);
app.get("/events", getEvents);

function handleError(error, response) {
  console.error(error);
  if (response) {
    response.status(500).send("Sorry, something went wrong here.");
  }
}

// Get lat/long info and map from Google API
function searchLatLong(request, response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${
    request.query.data
  }&key=${process.env.GEOCODE_API_KEY}`;

  superagent
    .get(url)
    .then(result => {
      const location = new Location(request.query.data, result);
      response.send(location);
    })
    .catch(error => handleError(error, response));
}

// Get weather data from DarkSky API
function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${
    process.env.WEATHER_API_KEY
  }/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent
    .get(url)
    .then(result => {
      const weatherResults = result.body.daily.data.map(
        day => new Forecast(day)
      );
      response.send(weatherResults);
    })
    .catch(error => handleError(error, response));
}

function getEvents(request, response) {
  // console.log("REQUEST : " + request.query.data.search_query);
  const url = `https://www.eventbriteapi.com/v3/events/search?token=${
    process.env.EVENTBRITE_API_KEY
  }&location.address=${request.query.data.search_query}`;
  superagent
    .get(url)
    .then(result => {
      // console.log(result.body);
      const events = result.body.events.map(data => {
        return new Event(data);
      });

      response.send(events);
    })
    .catch(error => handleError(error, response));
}