(function(e){function t(t){for(var r,i,s=t[0],u=t[1],c=t[2],p=0,d=[];p<s.length;p++)i=s[p],Object.prototype.hasOwnProperty.call(a,i)&&a[i]&&d.push(a[i][0]),a[i]=0;for(r in u)Object.prototype.hasOwnProperty.call(u,r)&&(e[r]=u[r]);l&&l(t);while(d.length)d.shift()();return o.push.apply(o,c||[]),n()}function n(){for(var e,t=0;t<o.length;t++){for(var n=o[t],r=!0,s=1;s<n.length;s++){var u=n[s];0!==a[u]&&(r=!1)}r&&(o.splice(t--,1),e=i(i.s=n[0]))}return e}var r={},a={app:0},o=[];function i(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],u=s.push.bind(s);s.push=t,s=s.slice();for(var c=0;c<s.length;c++)t(s[c]);var l=u;o.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";var r=n("8a23"),a=n.n(r);a.a},"1c50":function(e,t,n){},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("2b0e"),a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n("div",{attrs:{id:"nav"}}),n("router-view")],1)},o=[],i=(n("ac1f"),n("5319"),{name:"App",data:function(){return{}},mounted:function(){this.$router.replace({name:"Login"})}}),s=i,u=(n("034f"),n("2877")),c=Object(u["a"])(s,a,o,!1,null,null,null),l=c.exports,p=n("f309");r["a"].use(p["a"]);var d=new p["a"]({}),f=n("8c4f"),m=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("v-toolbar",{attrs:{color:"blue"}},[n("v-app-bar-nav-icon"),n("v-toolbar-title",[e._v("Login")]),n("v-spacer"),n("v-btn",{attrs:{icon:""}},[n("router-link",{attrs:{to:"/SignUp",replace:""}},[e._v("Sign up")])],1)],1),n("v-parallax",{attrs:{dark:"",src:"https://cdn.vuetifyjs.com/images/backgrounds/vbanner.jpg"}},[n("form",[n("v-text-field",{attrs:{input:"",type:"text",name:"username",placeholder:"Username"},model:{value:e.input.username,callback:function(t){e.$set(e.input,"username",t)},expression:"input.username"}}),n("v-text-field",{attrs:{input:"",type:"password",name:"password",placeholder:"Password"},model:{value:e.input.password,callback:function(t){e.$set(e.input,"password",t)},expression:"input.password"}}),n("v-btn",{attrs:{type:"button"},on:{click:function(t){return e.login()}}},[e._v("Login")]),n("v-btn",{on:{click:e.clear}},[e._v("clear")])],1)])],1)},v=[],b=n("bc3a"),g=n.n(b),h="https://studyroomfinder.herokuapp.com/",w=function(){return g.a.create({baseURL:h,withCredentials:!0})},y={login:function(e,t,n){w().post("/signin/",{username:t,password:n}).then((function(t){e.$router.replace({name:"Homepage"})})).catch((function(t){t.response&&(e.message=t.response.data)}))}},x={name:"Login",data:function(){return{input:{username:"",password:""}}},methods:{login:function(){var e=this;y.login(e,this.input.username,this.input.password)}}},_=x,k=n("6544"),j=n.n(k),L=n("5bc1"),S=n("8336"),O=n("8b9c"),M=n("2fa4"),$=n("8654"),E=n("71d9"),P=n("2a7f"),V=Object(u["a"])(_,m,v,!1,null,"65ddba97",null),T=V.exports;j()(V,{VAppBarNavIcon:L["a"],VBtn:S["a"],VParallax:O["a"],VSpacer:M["a"],VTextField:$["a"],VToolbar:E["a"],VToolbarTitle:P["a"]});var U=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("v-parallax",{attrs:{dark:"",src:"https://cdn.vuetifyjs.com/images/backgrounds/vbanner.jpg"}},[n("h1",[e._v("Sign Up!!! ")]),n("form",[n("v-text-field",{attrs:{input:"",type:"text",name:"username",required:"",placeholder:"Enter Username"},model:{value:e.input.username,callback:function(t){e.$set(e.input,"username",t)},expression:"input.username"}}),n("v-text-field",{attrs:{input:"",type:"password",name:"password",placeholder:"Enter Password"},model:{value:e.input.password,callback:function(t){e.$set(e.input,"password",t)},expression:"input.password"}}),n("v-btn",{attrs:{type:"button"},on:{click:function(t){return e.signup()}}},[e._v("Sign Up")]),n("v-btn",{on:{click:e.clear}},[e._v("clear")])],1)])],1)},J=[],z={signup:function(e,t,n){w().post("/signup/",{username:t,password:n}).then((function(e){"200"==e.status&&(window.location.href="/Login")})).catch((function(t){t.response&&(e.message=t.response.data)}))}},C={name:"Sign_up",data:function(){return{input:{username:"",password:""}}},methods:{signup:function(){var e=this;z.signup(e,this.input.username,this.input.password)}}},N=C,B=(n("77b8"),Object(u["a"])(N,U,J,!1,null,"505d40a9",null)),H=B.exports;j()(B,{VBtn:S["a"],VParallax:O["a"],VTextField:$["a"]});var I=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("h1",[e._v("Study Room Finder")]),n("input",{attrs:{type:"search",name:"search bar",id:"search_bar"}}),n("router-link",{attrs:{to:"/SignUp",replace:""}},[e._v("Sign up")]),n("router-link",{attrs:{to:"/Login",replace:""}},[e._v("Sign out")]),n("div",{staticClass:"map"},[n("Map")],1),e._m(0)],1)},D=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("footer",[n("a",{attrs:{href:"./credits.html"}},[e._v("credits")])])}],R=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("h1",[e._v("Map")]),n("l-map",{staticStyle:{height:"850px",width:"1000px"},attrs:{zoom:e.zoom,center:e.center}},[n("l-tile-layer",{attrs:{options:{maxZoom:22},url:e.url,attribution:e.attribution}}),n("l-marker",{attrs:{"lat-lng":e.marker}}),n("l-circle",{attrs:{"lat-lng":e.circle.center,radius:e.circle.radius}},[n("l-popup",{attrs:{content:"Circle"}})],1),n("l-rectangle",{attrs:{bounds:e.rectangle.bounds,color:e.rectangle.color}},[n("l-popup",{attrs:{content:"Rectangle"}})],1)],1)],1)},F=[],Z=n("2699"),q=n("a40a"),A=n("4e2b"),Y=n("0dbd"),G=n("fb8e"),K=n("e11e"),Q=n.n(K),W={name:"Map",components:{LMap:Z["a"],LTileLayer:q["a"],LMarker:A["a"],LCircle:Y["a"],LRectangle:G["a"]},data:function(){return{zoom:19,center:Q.a.latLng(43.7839,-79.1874),circle:{center:Q.a.latLng(43.7845,-79.1874),radius:30},rectangle:{bounds:[[43.7839,-79.1872],[43.7843,-79.186]],color:"red"},url:"https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=sk.eyJ1IjoiamZvbmc3MDEiLCJhIjoiY2s3cDExa3lxMDIzNDNrcnNwdjJlbndkZCJ9.n2BIBzqJ9gyJyHjlxnNENw",attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',marker:Q.a.latLng(43.7839,-79.1874)}}},X=W,ee=Object(u["a"])(X,R,F,!1,null,null,null),te=ee.exports,ne={name:"Homepage",data:function(){return{input:{username:"",password:""}}},components:{Map:te}},re=ne,ae=(n("b304"),Object(u["a"])(re,I,D,!1,null,"30cbe790",null)),oe=ae.exports;r["a"].use(f["a"]);var ie=new f["a"]({routes:[{path:"/",redirect:{name:"Login"}},{path:"/Login",name:"Login",component:T},{path:"/Homepage",name:"Homepage",component:oe},{path:"/SignUp",name:"SignUp",component:H}]});n("6cc5");r["a"].config.productionTip=!1,new r["a"]({vuetify:d,router:ie,render:function(e){return e(l)}}).$mount("#app")},"77b8":function(e,t,n){"use strict";var r=n("fbdb"),a=n.n(r);a.a},"8a23":function(e,t,n){},b304:function(e,t,n){"use strict";var r=n("1c50"),a=n.n(r);a.a},fbdb:function(e,t,n){}});
//# sourceMappingURL=app.7cedb4e6.js.map