# Study Room Finder

## Links
- [Live App](https://studyroomfinder.herokuapp.com) (Note: will take a few seconds for initial load, using free dynos on Heroku means that the dyno will probably be sleeping when you try to open it)
- [Video](https://youtu.be/b2HlA6m_ho8)
- [API documentation (Github Wiki)](https://github.com/UTSCC09/project-hardworking-sloth/wiki/API-Documentation)
- [Build Instructions (Github Wiki)](https://github.com/UTSCC09/project-hardworking-sloth/wiki/Build-Instructions)

## Team members of Hardworking Sloth
- Anurudran Chandrasekaram
- Jason Fong
- Omid Najmeddini

## Description of web application
Have you ever walked all over campus looking for study space? Not anymore! Study Room Finder allows UTSC students to help their fellow students find study space by reporting where there is empty study space.

## Key features for Beta version
- Map of UTSC with overlays for study space
- Ability for users to report free study space


## Key features for Final version
- Live updating of geofences of a building using websockets where it shows the availability of study rooms by updating the color to green for available, yellow for occupied and red for full
- Use of vuetify for updating the UI elements to make the website look better
- Based on user location, recommend closest study space with availability

## Technologies
- Node.js: for running our application backend
- Express.js, express-session: handling HTTP requests
- Front end framework: Vue and Vuetify
- Heroku: Deployment Platform
- Javascript built-in technologies: native Websockets API, Promises
- Maps UI Library: Leaflet, Vue-Leaflet
- Map Tiles Provider: Mapbox API
- MongoDB: Storing study spot, user, location information, location queries
- Radar.io: a Geofencing SDK and API
- ws: Websockets library for Node.js

## Top 5 Technical Challenges
- Vue: Learning to use a front end framework such as Vue and related component libraries such as Vuetify
- Maps frontend: Creating map components using Vue Leaflet and interfacing with  other components
- Radar API: Integrating geofences into project and updating backend and map with Radar events
- Asynchronicity: Handling asynchronous events for UI updates and network requests between frontend, backend and Radar
- WebSockets: Deciding between libraries (socket.io vs ws), keeping backend performant, ensuring connection stays open on Heroku, and integrating properly in Vue
