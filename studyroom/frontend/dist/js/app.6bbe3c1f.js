(function(e){function t(t){for(var r,i,u=t[0],s=t[1],c=t[2],l=0,d=[];l<u.length;l++)i=u[l],Object.prototype.hasOwnProperty.call(a,i)&&a[i]&&d.push(a[i][0]),a[i]=0;for(r in s)Object.prototype.hasOwnProperty.call(s,r)&&(e[r]=s[r]);p&&p(t);while(d.length)d.shift()();return o.push.apply(o,c||[]),n()}function n(){for(var e,t=0;t<o.length;t++){for(var n=o[t],r=!0,u=1;u<n.length;u++){var s=n[u];0!==a[s]&&(r=!1)}r&&(o.splice(t--,1),e=i(i.s=n[0]))}return e}var r={},a={app:0},o=[];function i(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="/";var u=window["webpackJsonp"]=window["webpackJsonp"]||[],s=u.push.bind(u);u.push=t,u=u.slice();for(var c=0;c<u.length;c++)t(u[c]);var p=s;o.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";var r=n("85ec"),a=n.n(r);a.a},"1bc9":function(e,t,n){},"2e78":function(e,t,n){"use strict";var r=n("1bc9"),a=n.n(r);a.a},"40da":function(e,t,n){"use strict";var r=n("f5ed"),a=n.n(r);a.a},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("2b0e"),a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n("div",{attrs:{id:"nav"}},[e.authenticated?n("router-link",{attrs:{to:"/Login",replace:""},nativeOn:{click:function(t){return e.logout()}}},[e._v("Logout")]):e._e()],1),n("router-view",{on:{authenticated:e.setAuthenticated}})],1)},o=[],i=(n("ac1f"),n("5319"),{name:"App",data:function(){return{}},mounted:function(){this.$router.replace({name:"Login"})},methods:{setAuthenticated:function(e){this.authenticated=e},logout:function(){this.authenticated=!1}}}),u=i,s=(n("034f"),n("2877")),c=Object(s["a"])(u,a,o,!1,null,null,null),p=c.exports,l=n("8c4f"),d=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"Login"}},[n("h1",[e._v("Login")]),n("input",{directives:[{name:"model",rawName:"v-model",value:e.input.username,expression:"input.username"}],attrs:{type:"text",name:"username",placeholder:"Username"},domProps:{value:e.input.username},on:{input:function(t){t.target.composing||e.$set(e.input,"username",t.target.value)}}}),n("input",{directives:[{name:"model",rawName:"v-model",value:e.input.password,expression:"input.password"}],attrs:{type:"password",name:"password",placeholder:"Password"},domProps:{value:e.input.password},on:{input:function(t){t.target.composing||e.$set(e.input,"password",t.target.value)}}}),n("button",{attrs:{type:"button"},on:{click:function(t){return e.login()}}},[e._v("Login")])])},f=[],m=n("bc3a"),v=n.n(m),h=Object({NODE_ENV:"production",BASE_URL:"/"}).API_URL||"http://localhost:3000",g=function(){return v.a.create({baseURL:h,withCredentials:!0})},_={login:function(e,t,n){var r=this;g().post("/signin/",{username:t,password:n}).then((function(e){r.$router.replace({name:"Homepage"})})).catch((function(t){t.response&&(e.message=t.response.data)}))}},b={name:"Login",data:function(){return{input:{username:"",password:""}}},methods:{login:function(){var e=this;_.login(e,this.input.username,this.input.password)}}},w=b,y=(n("2e78"),Object(s["a"])(w,d,f,!1,null,"e51892e8",null)),O=y.exports,j=function(){var e=this,t=e.$createElement;e._self._c;return e._m(0)},x=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"secure"}},[n("h1",[e._v("SIGNUPPP!!!")]),n("p",{attrs:{id:"err_msg"}}),n("form",{attrs:{id:"signup_form"}},[n("div",{staticClass:"sigin-info"},[n("p",[e._v("Enter your username")]),n("input",{attrs:{type:"text",name:"username",required:""}}),n("p",[e._v("Enter your password")]),n("input",{attrs:{type:"password",name:"password",id:"password",required:""}})]),n("input",{attrs:{type:"submit",id:"signin",name:"action",value:"Submit"}})])])}],L={name:"Sign_up",data:function(){return{}}},P=L,S=(n("40da"),Object(s["a"])(P,j,x,!1,null,"df852ce2",null)),E=S.exports,$=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("h1",[e._v("Study Room Finder")]),n("input",{attrs:{type:"search",name:"search bar",id:"search_bar"}}),n("router-link",{attrs:{to:"/login",replace:""}},[e._v("Login")]),n("router-link",{attrs:{to:"/secure",replace:""}},[e._v("Sign in")]),e.authenticated?n("router-link",{attrs:{to:"/Homepage",replace:""}},[e._v("Sign out")]):e._e(),e._m(0)],1)},k=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("footer",[n("a",{attrs:{href:"./credits.html"}},[e._v("credits")])])}],U={name:"Homepage",data:function(){return{input:{username:"",password:""}}}},A=U,H=Object(s["a"])(A,$,k,!1,null,"2b599024",null),N=H.exports;r["a"].use(l["a"]);var M=new l["a"]({routes:[{path:"/",redirect:{name:"Login"}},{path:"/Login",name:"Login",component:O},{path:"/Homepage",name:"Homepage",component:N},{path:"/SignUp",name:"SignUp",component:E}]});r["a"].config.productionTip=!1,new r["a"]({router:M,render:function(e){return e(p)}}).$mount("#app")},"85ec":function(e,t,n){},f5ed:function(e,t,n){}});
//# sourceMappingURL=app.6bbe3c1f.js.map