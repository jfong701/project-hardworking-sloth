import Vue from 'vue'
import VueRouter from 'vue-router'
import LoginComponent from "../components/Login.vue"
import SignUpComponent from "../components/Sign_up.vue"
import HomepageComponent from "../components/Homepage.vue"


Vue.use(VueRouter)

export default new VueRouter({
    routes: [
        {
            path: '/',
            redirect: {
                name: "Login"
            }
        },
        {
            path: "/Login",
            name: "Login",
            component: LoginComponent
        },
        {
            path: "/Homepage",
            name: "Homepage",
            component: HomepageComponent
        },
        {
            path: "/SignUp",
            name: "SignUp",
            component: SignUpComponent
        }
    ]
})