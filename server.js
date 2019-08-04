'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require(`superagent`)
const app = express();
const PORT = process.env.PORT || 3000;
let currentLoc = null;

function Location(request, geoData) {
  this.search_query = request;
  this.formatted_address = geoData.body.results[0].formatted_address;
  this.latitude = Number(geoData.body.results[0].geometry.location.lat);
  this.longitude = Number(geoData.body.results[0].geometry.location.lng);
}

function Forecast(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function serchToLatLong(query){
  const url =`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(res => {
      currentLoc = new Location(query, res);
      return currentLoc;
    })
}

function darkskyWeather(lat, lon){
  console.log('Getting Dark!!!')
  const url = `https://api.darksky.net/forecast/${process.env.DARK_SKY}/${lat},${lon}`;
  const weatherSummaries =[];
  return superagent.get(url)
    .then(res => {
      res.body.daily.data.forEach(day => {
        weatherSummaries.push(new Forecast(day));
        console.log(weatherSummaries)
        console.log('finish Dark!!!')
      });
      return weatherSummaries;
    });
}

app.use(express.static('./public'));
app.use(cors());

app.get('/location', (request, response) => {
  serchToLatLong(request.query.data)//Serch box entry
    .then(location => response.send(location));
})

app.get('/weather', (currentLoc, response) => {
  console.log('starting');
  darkskyWeather(currentLoc.query.data.latitude, currentLoc.query.data.longitude)
    .then(weather => {
      console.log(weather, 'llama');
      response.send(weather);
      console.log(`Sent Weather`)
    })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
