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
    <v-btn @click="clear">clear</v-btn>
  </form>
  </v-parallax>
    </div>
</template>


<script>
import Login from '../js/login.js';

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
           }
        }
    }
</script>

<style scoped>
</style>