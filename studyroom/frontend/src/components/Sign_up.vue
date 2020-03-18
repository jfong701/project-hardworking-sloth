<template>
    <div id="secure">
        <h1>SIGNUPPP!!!</h1>
        <p id="err_msg"></p>
        <form id="signup_form">
          <div class="sigin-info">
            <p>Enter your username</p>
            <input type="text" name="username" required/>
            <p>Enter your password</p>
            <input type="password" name="password" id="password" required>
          </div>
          <input type="submit" id="signin" name="action" value="Submit">
        </form>
    </div>
</template>

<script>
    export default {
        name: 'Sign_up',
        data() {
            return {};
        }
    }
</script>

<style scoped>
    #secure {
        background-color: #FFFFFF;
        border: 1px solid #CCCCCC;
        padding: 20px;
        margin-top: 10px;
    }
</style>