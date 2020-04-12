<template>
    <div>
    <v-toolbar color="blue" >
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>Login</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <router-link  to="/SignUp" replace>Sign up</router-link>
      </v-btn>
    </v-toolbar>
    <v-parallax
    dark
    src="https://cdn.vuetifyjs.com/images/backgrounds/vbanner.jpg"
  >
    <form>
    <v-text-field
      input type="text" name="username" v-model="input.username" placeholder="Username"
    ></v-text-field>
    <v-text-field
      input type="password" name="password" v-model="input.password" placeholder="Password"
    ></v-text-field>
    <v-btn type="button" v-on:click="login()">Login</v-btn>
  </form>
  </v-parallax>
  <footer>
      <router-link to="/Credits" replace><v-list-item-title>Credits</v-list-item-title></router-link>
  </footer>
  </div>
</template>


<script>
import Login from '../js/login.js';
// Imports the Radar SDK module
import Radar from 'radar-sdk-js';
// Initializes SDK by passing the publishable key as a string parameter
// TODO: Set the publishable key to a variable as pass it as a parameter here
Radar.initialize("prj_test_pk_18eeb5f920e2f5feb64423dbb299211811bc45a0");
    export default {
        name: 'Login',
        data() {
            return {
                input: {
                    username: "",
                    password: ""
                }
            }
        },
        methods: {
            login: function() {
            let self = this;
			Login.login(self, this.input.username, this.input.password);
      // Identifies user  when logged, stores a cookie with UUID "device ID"
      Radar.setUserId(this.input.username);
      Radar.trackOnce(function(status, location, user, events) {
        // do something with status, location, user, events
        console.log(status, location, user, events);
        // Note that the location of the user may not be very accurate
      });
           }
        }
    }
</script>

<style scoped>
</style>
