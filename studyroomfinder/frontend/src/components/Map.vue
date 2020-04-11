<template>
  <div>
    <h1>Map</h1>
    <v-btn type="button" v-on:click="trackOnce()">track</v-btn>
    <p>About {{ userData.userId }}</p>
    <ul>
      <li>Location: {{ sortCoords(userData.location.coordinates) }}</li>
      <li>Device type: {{ userData.deviceType }} </li>
      <li>Agent: {{ userData.userAgent }}</li>
    </ul>
    <p> Users </p>
    <ul v-for="user in usersData" :key="user._id">
      <li>User ID: {{ user.userId }}</li>
      <li>location: {{ sortCoords(user.location.coordinates) }}</li>
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
      <!-- Adds a unique icon for the user in the session -->
      <dir class="current-user-marker">
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

      <!--
      Adds polygons for the buldings on the map from Radar
      -->
      <div class="geofences" v-for="geofence in geofences" :key="geofence._id">
        <l-polygon :lat-lngs="sortPolyCoords(geofence.geometry.coordinates)">
          <l-popup>
            {{ geofence.description}} ({{ geofence.externalId }})
            <ul>
              <li v-if="geofence.metadata.hasWifi">Wifi included</li>
              <li>Status: {{ geofence.metadata.status }} </li>
              <li v-if="geofence.metadata.isVerified">Verified</li>
              <li v-else>Not verifed</li>
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
      userMapIcon: require('../../media/user_map_icon.png'),
      currUserMapIcon: require('../../media/current_user_map_icon.png'),
      iconSize: 32,
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
    this.usersData = this.displayUsers();
    this.userData = this.displayUser();
    this.geofences =  this.displayGeofences();
    this.events = this.displayEvents();
  },
  methods:{
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
      Radar.getGeofences(self).then(result => this.geofences = result);
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
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>


</style>

<!---Reference:
http://jsfiddle.net/Boumi/k04zpLx9 --->
