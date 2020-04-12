<template>
  <div class="wrapper">
    <div>
        <ejs-sidebar id="default-sidebar" ref="sidebar" :type="type" :width="width" :animate="animate" :enableRtl="enableRtl">
            <div class="center-align">
                <form>
                    <div>
                    <label for="Building Space">:Building Space</label>
                    <input v-model="building" type="building" placeholder="building">
                    </div>
                    <div>
                    <label for="Study Space">:Study Space</label>
                    <input v-model="studySpaceName" type="studySpaceName" placeholder="studySpaceName">
                    </div>
                    <div>
                    <label for="Availability">:Availability</label>
                    <input v-model="availability" type="availability" placeholder="Available/Nearly Full/Full">
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
        <l-polygon :lat-lngs="sortPolyCoords(geofence.geometry.coordinates)">
          <l-popup>
            {{ geofence.description}} ({{ geofence.externalId }})
            <ul>
              <li v-if="geofence.metadata.hasWifi">Wifi included</li>
            </ul>
            <button ejs-button id="toggle"  class="e-btn e-info" v-on:click="toggleClick">Report Study Space</button>
          </l-popup>
        </l-polygon>
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
            enableRtl: true,
            width:'280px',
            type:'Push',
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
      studySpaces: null,
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
  created () {
    this.userData = this.displayUsers();
    this.geofences =  this.displayGeofences();
    this.events = this.displayEvents();
    this.studySpaces = this.displayStudySpaces();
  },
  methods:{
    toggleClick :function() {
          this.$refs.sidebar.toggle();
        },
    report: function() {
            let self = this;
			Report.report(self, this.building, this.studySpaceName, this.availability);
           },
    displayStudySpaces: function () {
      let self = this;
      Report.getStudySpaces(self).then(result => this.studySpaces = result);
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

<style>
@import "../../node_modules/@syncfusion/ej2-base/styles/material.css";
@import "../../node_modules/@syncfusion/ej2-buttons/styles/material.css";
@import "../../node_modules/@syncfusion/ej2-vue-navigations/styles/material.css";


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




</style>

<!---Reference:
http://jsfiddle.net/Boumi/k04zpLx9 --->
