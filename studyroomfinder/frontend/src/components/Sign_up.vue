<template>
    <div>
    <v-parallax
    dark
    src="https://cdn.vuetifyjs.com/images/backgrounds/vbanner.jpg"
  >
  <h1>Sign Up!!! </h1>
    <form>
    <v-text-field
      input type="text" name="username" v-model="input.username" required placeholder="Enter Username"
    ></v-text-field>
    <v-text-field
      input type="password" name="password" v-model="input.password" placeholder="Enter Password"
    ></v-text-field>
    <v-btn type="button" v-on:click="signup()">Sign Up</v-btn>
  </form>
  </v-parallax>
  <footer>
      <router-link to="/Credits" replace>Credits</router-link>
  </footer>
    </div>
</template>

<script>
import SignUp from '../js/signup.js';

    export default {
        name: 'Sign_up',
        data() {
            return {
                input: {
                    username: "",
                    password: ""
                }
            }
        },
        methods: {
            signup: function() {
            let self = this;
			SignUp.signup(self, this.input.username, this.input.password);
           }
        }
    }
</script>

<style scoped>
    #signup {
        background-color: #FFFFFF;
        border: 1px solid #CCCCCC;
        padding: 20px;
        margin-top: 10px;
    }
</style>