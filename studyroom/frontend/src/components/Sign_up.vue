<template>
    <div id="signup">
        <h1>SIGNUPPP!!!</h1>
        <p id="err_msg"></p>
        <form id="signup_form">
          <div class="sigin-info">
            <p>Enter your username</p>
            <input type="text" name="username" v-model="input.username" required/>
            <p>Enter your password</p>
            <input type="password" name="password" id="password" v-model="input.password" required>
          </div>
          <button type="button" v-on:click="signup()">Sign Up</button>
        </form>
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