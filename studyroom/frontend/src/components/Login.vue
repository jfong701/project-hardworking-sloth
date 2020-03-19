<template>
<div id="login">
    <div>
        <h1>Login</h1>
        <input type="text" name="username" v-model="input.username" placeholder="Username" />
        <input type="password" name="password" v-model="input.password" placeholder="Password" />
        <button type="button" v-on:click="login()">Login</button>
    </div>
    <div class=".s">
    <router-link  to="/SignUp" replace>Sign in</router-link>
    </div>
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