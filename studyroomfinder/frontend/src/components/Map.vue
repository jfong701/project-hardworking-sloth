<template>
  <div class="wrapper">
    <div>
        <ejs-sidebar id="default-sidebar" ref="sidebar" :type="type" :width="width" :animate="animate" :enableRtl="enableRtl">
            <div class="center-align">
                <form>
                    <div>
                    <label for="Building Space">:Building Space</label>
                    <input v-model="building" placeholder="building">
                    </div>
                    <div>
                    <label for="Study Space">:Study Space</label>
                    <input v-model="studySpaceName" placeholder="studySpaceName">
                    </div>
                    <div>
                    <label for="Availability">:Availability</label>
                    <input v-model="availability" placeholder="Available/Nearly Full/Full">
                    </div>
                </form>
            </div>
            <ul v-for="studySpace in studySpaces" :key="studySpace._id">
            <p class = "sub-title">Study Space: {{studySpace.name}}, Building Name: {{studySpace.buildingName}}, Id: {{studySpace._id}}</p>
            </ul>
            <div class="center-align">
               <v-btn type="button"  v-on:click="report()">Report</v-btn>
            </div>
        </ejs-sidebar>
        </div>
        
  <div>
    <h1>Map</h1>
    <div v-if="userData">
      <p>About {{ userData.userId }}</p>
      <ul>
        <li>Location: {{ sortCoords(userData.location.coordinates) }}</li>
        <li>Device type: {{ userData.deviceType }} </li>
        <li>Agent: {{ userData.userAgent }}</li>
        <li>Updated at: {{ userData.actualUpdatedAt }}</li>
      </ul>
    </div>
    
    <p> Users </p>
    <div v-if="usersData">
      <ul  v-for="user in usersData.slice(0,10)" :key="user._id">
        <li>User ID: {{ user.userId }}</li>
        <li v-if="user.geofences.length > 0">
          Currently in {{ user.geofences[0].description }}
        </li>
        <li>Updated at: {{ user.actualUpdatedAt }}</li>
      </ul>
    </div>
    
    <p> Geofences </p>
    <div v-if="geofences">
      <ul v-for="geofence in geofences" :key="geofence._id">
        <li>Name: {{ geofence.description }}</li>
        <li>ID: {{ geofence.externalId}}</li>
      </ul>
    </div>
    
    <p> Events </p>
    <div v-if="radarEvents">
      <ul v-for="event in radarEvents.slice(0,5)" :key="event._id">
        <li>{{ event.user.userId }} has entered {{ event.geofence.description}} at {{ event.createdAt }}</li>
      </ul>
    </div>

    <div class="hidden">{{buildings}}</div> <!-- ensures websockets connect -->
    <l-map :zoom="zoom" :center="center" style="height: 850px; width: 1000px">
    <l-tile-layer :options="{ maxZoom: 22 }" :url="url" :attribution="attribution"></l-tile-layer>
      <!-- Adds a unique icon for the user in the session -->
      <dir class="current-user-marker" v-if="userData">
        <l-marker :lat-lng="sortCoords(userData.location.coordinates)">
          <l-popup>{{userData.userId}}</l-popup>
          <l-icon
              :icon-size="dynamicSize"
              :icon-anchor="dynamicAnchor"
              :icon-url="currUserMapIcon" >
          </l-icon>
        </l-marker>
      </dir>

      <!--
      Adds icons to the map where the locations are the user locations
      -->
      <div v-if="usersData && userData">
        <div class="user-markers" v-for="user in usersData" :key="user._id">
          <l-marker v-if="user.userId != userData.userId && user.geofences.length != 0" :lat-lng="[user.location.coordinates[1], user.location.coordinates[0]]">
            <l-popup>{{ user.userId }}</l-popup>
            <l-icon
                :icon-size="dynamicSize"
                :icon-anchor="dynamicAnchor"
                :icon-url="userMapIcon" >
            </l-icon>
          </l-marker>
        </div>
      </div>
      
      <!--
      Adds polygons for the buldings on the map from Radar
      -->
      <div v-if="geofences">
        <div class="geofences" v-for="geofence in geofences" :key="geofence._id">
          <l-polygon :lat-lngs="sortPolyCoords(geofence.geometry.coordinates)" :color="geofence.color">
            <l-popup>
              {{ geofence.description}} ({{ geofence.externalId }})
              <ul>
                <li v-if="geofence.metadata.hasWifi">Wifi included</li>
              </ul>
              <button ejs-button id="toggle"  class="e-btn e-info" v-on:click="toggleClick">Report Study Space</button>
            </l-popup>
          </l-polygon>
        </div>
      </div>
      
      
    </l-map>
  </div>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LIcon, LPopup, LPolygon} from 'vue2-leaflet';
import L from 'leaflet';
import Radar from '../js/radar.js';
import Vue from 'vue';
import { SidebarPlugin } from '@syncfusion/ej2-vue-navigations';
import Report from '../js/report.js';


Vue.use(SidebarPlugin);

export default {
  name: 'Map',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIcon,
    LPopup,
    LPolygon,
    },
  data() {
    return {
      animate:false,
            enableRtl: false,
            width:'280px',
            type:'Push',
      zoom:19,
      center: L.latLng(43.7839, -79.1874),
      icon: L.icon({
        iconUrl: 'https://lh3.googleusercontent.com/proxy/ZcYtqlXeuGOHru0UFzvHemclleQK6NVJVYlkEZvTRXrptObMScvVrDwkWr44AeDTE1DdsgrxL8F3',
        iconAnchor: [64,16]
      }),
      url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=sk.eyJ1IjoiamZvbmc3MDEiLCJhIjoiY2s3cDExa3lxMDIzNDNrcnNwdjJlbndkZCJ9.n2BIBzqJ9gyJyHjlxnNENw',
      attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      marker: L.latLng(43.7839, -79.1874),
      usersData: null,  // Data for all users from Radar
      userData: null,   // Data for the current user from Radar
      geofences: null,
      radarEvents: null,
      trackData: null,
      userMapIcon: require('../../media/user_map_icon.png'),
      currUserMapIcon: require('../../media/current_user_map_icon.png'),
      iconSize: 32,
      buildings: null,
      socket: null,
      studySpaces: null,
      availability: null,
      studySpaceName: null,
      building: null,
      loadUsersOnce: true,
      loadUserOnce: true,
      loadTrackOnce: true
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
    let getUsersCont = setInterval(() => {
      this.displayUsers();
    }, 12000);
    let getUserCont = setInterval(() => {
      this.displayUser();
    }, 5000);
    let getTrackCont = setInterval(() => {
      this.trackOnce();
    }, 8000);
    this.usersData =  (this.loadUsersOnce)? this.getUsersOnce() : getUsersCont;
    this.userData = (this.loadUserOnce)? this.getUserOnce() : getUserCont;
    this.geofences =  this.displayGeofences(); // also sets up socket
    this.events = this.displayEvents();
    this.studySpaces = this.displayStudySpaces();
    this.trackData =  (this.loadTrackOnce)? this.getTrackOnce() : getTrackCont;
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
    toggleClick :function() {
          this.$refs.sidebar.toggle();
        },
    report: function() {
            let self = this;
            Report.report(self, this.building, this.studySpaceName, this.availability)
            .then(() => {
              // only send socket update if valid;
              self.socket.send("availabilityUpdated");
            });
    },
    displayStudySpaces: function () {
      let self = this;
      Report.getStudySpaces(self).then(result => this.studySpaces = result);
    },
    displayUsers: function () {
      let self = this;
        Radar.getUsers(self).then(result => this.usersData = result);
    },
    displayUser: function (){
      let self = this;
      Radar.getUser(self).then(result => this.userData = result);
      
    },
    displayGeofences: function(){
      let self = this;
      Radar.getGeofences(self).then(result => this.geofences = result)
      .then(self.setupSocket());
    },
    displayEvents: function(){
      let self = this;
      Radar.getRadarEvents(self).then(result => this.radarEvents = result);
    },
    // Sorts coordinates from switching latitude 
    // and longitude for an array of coordinates
    sortPolyCoords: function(coords){
      var newCoords = [];
      for(var i=0; i < coords.length; i++){
        const currCoord = coords[i];
        newCoords.push(L.GeoJSON.coordsToLatLngs(currCoord));
      }
      return newCoords;
    },
    // Sorts coordinates from switching latitude 
    // and longitude for the given coordinate
    sortCoords: function(coord){
      return [coord[1], coord[0]];
    },
    // Returns an array of the tracking
    // data such as geofences and events
    trackOnce: function(){
      return Radar.trackOnce();
    },
    getTrackOnce: function(){
      this.trackOnce();
      this.loadTrackOnce = false;
    },
    getUsersOnce: function(){
      this.displayUsers();
      this.loadUsersOnce = false;
    },
    getUserOnce: function(){
      this.displayUser();
      this.loadUserOnce = false;
    }
  }
}
</script>

<style scoped>
@import "../../node_modules/@syncfusion/ej2-base/styles/material.css";
@import "../../node_modules/@syncfusion/ej2-buttons/styles/material.css";
@import "../../node_modules/@syncfusion/ej2-vue-navigations/styles/material.css";

.hidden {display: none;}

.center-align {
    text-align: center;
    font-size: 20px;
    padding: 20px;
}

.title {
    text-align: center;
    font-size: 20px;
    padding: 15px;
}

.sub-title {
    text-align: center;
    font-size: 16px;
    padding: 10px;
}

.center {
    text-align: center;
    display: none;
    font-size: 13px;
    font-weight: 400;
    margin-top: 20px;
}

#default-sidebar {
    background-color: rgb(25, 118, 210);
    color: #ffffff;
}

.close-btn:hover {
    color: #fafafa;
}

::placeholder {
  color: black;
}

input {
  width: 100%;
  margin: 8px 0;
  box-sizing: border-box;
  border: 2px solid black;
}
</style>

