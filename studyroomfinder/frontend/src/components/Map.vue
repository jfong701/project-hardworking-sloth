<template>
  <div>
    <h1>Map</h1>
    <p> Users </p>
    <ul v-for="user in userData" :key="user._id">
      <li>User ID: {{ user.userId }}</li>
      <li>location: {{ user.location.coordinates[1]}}</li>
      <li>location: {{ user.location.coordinates[0]}}</li>
    </ul>
    <p> Geofences </p>
    <ul v-for="geofence in geofences" :key="geofence._id">
      <li>Name: {{ geofence.description }}</li>
      <li>ID: {{ geofence.externalId}}</li>
    </ul>
    <p> Events </p>
    <ul v-for="event in radarEvents" :key="event._id">
      <li>{{ event.user.userId }} has entered {{ event.geofence.description}} at {{ event.createdAt }}</li>

    </ul>
    <p> WebSockets Test </p>
    <!-- <p>{{studySpaces}}</p> -->
    <ul v-for="building in buildings" :key="building._id">
      <li>{{building._id}}</li>
    </ul>
    <l-map :zoom="zoom" :center="center" style="height: 850px; width: 1000px">
    <l-tile-layer :options="{ maxZoom: 22 }" :url="url" :attribution="attribution"></l-tile-layer>
      <!--
      TODO: Adds icons to the map where the locations are the user locations
      -->
      <div class="user-markers" v-for="user in userData" :key="user._id">
        <l-marker :lat-lng="[user.location.coordinates[1], user.location.coordinates[0]]">
          <l-popup>{{ user.userId }}</l-popup>
          <l-icon
              :icon-size="dynamicSize"
              :icon-anchor="dynamicAnchor"
              :icon-url="userMapIcon" >
          </l-icon>
        </l-marker>
      </div>

      <!--
      Adds polygons for the buldings on the map from Radar
      -->
      <div class="geofences" v-for="geofence in geofences" :key="geofence._id">
        <l-polygon :lat-lngs="sortPolyCoords(geofence.geometry.coordinates)" :color="geofence.color">
          <l-popup>
            {{ geofence.description}} ({{ geofence.externalId }})
            <ul>
              <li v-if="geofence.metadata.hasWifi">Wifi included</li>
            </ul>
          </l-popup>
        </l-polygon>
      </div>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LIcon, LPopup, LPolygon} from 'vue2-leaflet';
import L from 'leaflet';
import Radar from '../js/radar.js';



export default {
  name: 'Map',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIcon,
    LPopup,
    LPolygon
  },
  data() {
    return {
      zoom:19,
      center: L.latLng(43.7839, -79.1874),
      circle: {
        center: L.latLng(43.7845, -79.1874),
        radius: 30
      },
      rectangle: {
        bounds: [[43.7839, -79.1872], [43.7843, -79.1860]],
        color: "red"
      },
      icon: L.icon({
        iconUrl: 'https://lh3.googleusercontent.com/proxy/ZcYtqlXeuGOHru0UFzvHemclleQK6NVJVYlkEZvTRXrptObMScvVrDwkWr44AeDTE1DdsgrxL8F3',
        iconAnchor: [64,16]
      }),
      url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=sk.eyJ1IjoiamZvbmc3MDEiLCJhIjoiY2s3cDExa3lxMDIzNDNrcnNwdjJlbndkZCJ9.n2BIBzqJ9gyJyHjlxnNENw',
      attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      marker: L.latLng(43.7839, -79.1874),
      userData: null,
      geofences: null,
      radarEvents: null,
      userMapIcon: require('../../media/user_map_icon.png'),
      iconSize: 32,
      buildings: null,
      socket: null,
    };
  },
  computed: {
    dynamicSize () {
      return [this.iconSize, this.iconSize];
    },
    dynamicAnchor () {
      return [this.iconSize / 2, this.iconSize];
    }
  },
  beforeDestroy() {
    // if this component is being destroyed from DOM, close the socket connection.
    this.closeSocket();
  },
  created () {
    this.userData = this.displayUsers();
    this.geofences =  this.displayGeofences();
    this.events = this.displayEvents();
    this.setupSocket();
  },
  methods:{
    closeSocket: function() {
      let self = this;
      if (self.socket) {
        self.socket.close();
      }
    },
    setupSocket: function() {
      let self = this;

      // helper function for unescaping html from: https://github.com/validatorjs/validator.js/blob/master/src/lib/unescape.js
      // used because the names of buildings are escaped in the database
      function unescape(str) {
        return (str.replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#x2F;/g, '/')
          .replace(/&#x5C;/g, '\\')
          .replace(/&#96;/g, '`'));
      }

      const WS_URL = process.env.VUE_APP_WS_URL || 'ws://localhost:5000';

      const socket = new WebSocket(WS_URL);
      self.socket = socket;

      // listening for updates from the backend
      socket.addEventListener('message', function(event) {
        // nextTick - fire after next Vue DOM update cycle
        self.$nextTick(function() {

          // only set buildings if not a WS ping. (pings are sent to prevent connection sleep on Heroku);
          if (event.data !== "ping") {
            // set buildings based on data from websocket.
            self.buildings = JSON.parse(event.data);

            // match up buildings and geofences by common names, and set colours
            if (self.buildings && self.geofences) {
              for (let i = 0; i < self.geofences.length; i++) {
                for (let j = 0; j < self.buildings.length; j++) {
                  if (unescape(self.buildings[j]._id) === self.geofences[i].externalId) {
                    // colours from: https://flatuicolors.com/palette/defo
                    switch(self.buildings[j].status) {
                      case "Nearly Full":
                        self.geofences[i].color = "#f1c40f";
                        break;
                      case "Full":
                        self.geofences[i].color = "#c0392b";
                        break;
                      case "Available":
                        self.geofences[i].color = "#27ae60";
                        break;
                      default:
                        self.geofences[i].color = "#7f8c8d";  
                    }
                  }
                }
              }
            }
          }
        });
      });
    },
    displayUsers: function () {
      let self = this;
      Radar.getUsers(self).then(result => this.userData = result);
    },
    displayGeofences: function(){
      let self = this;
      Radar.getGeofences(self).then(result => this.geofences = result);
    },
    displayEvents: function(){
      let self = this;
      Radar.getRadarEvents(self).then(result => this.radarEvents = result);
    },
    sortPolyCoords: function(coords){
      var newCoords = [];
      for(var i=0; i < coords.length; i++){
        const currCoord = coords[i];
        newCoords.push(L.GeoJSON.coordsToLatLngs(currCoord));
      }
      return newCoords;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>


</style>

<!---Reference:
http://jsfiddle.net/Boumi/k04zpLx9 --->
