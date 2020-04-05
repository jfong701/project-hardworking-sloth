<template>
<div id="login">
    <div>
        <h1>Login</h1>
        <input type="text" name="username" v-model="input.username" placeholder="Username" />
        <input type="password" name="password" v-model="input.password" placeholder="Password" />
        <button type="button" v-on:click="login()">Login</button>
    </div>
    <div class=".s">
    <router-link  to="/SignUp" replace>Sign up</router-link>
    </div>
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
    #login {
        display: flex;
        justify-content: center;
        align-content: space-around;
    }

    .s {
        padding: 20px;
        justify-content: flex-end;
    }
</style>
