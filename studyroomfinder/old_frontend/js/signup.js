(function(){
    "use strict";

    window.addEventListener('load', function(){
      api.onError(function(err){
          console.error("[error]", err);
      });

      api.onError(function(err){
          var error_box = document.querySelector('#err_msg');
          error_box.innerHTML = err;
          error_box.style.visibility = "visible";
      });

      api.onUserUpdate(function(username){
          if (username) window.location.href = '/';
      });

      function submit(){
          console.log(document.querySelector("form").checkValidity());
          if (document.querySelector("form").checkValidity()){
              var username = document.querySelector("form [name=username]").value;
              var password =document.querySelector("form [name=password]").value;
              var firstName =document.querySelector("form [name=first-name]").value;
              var lastName =document.querySelector("form [name=last-name]").value;
              var email =document.querySelector("form [name=email]").value;
              var bio =document.querySelector("form [name=bio]").value;
              api.signup(username, password, firstName, lastName, email, bio);
          }
      }

      document.querySelector('#signup').addEventListener('click', function(e){
          document.querySelector("form [name=action]").value = 'Submit';
          submit();
      });

      document.querySelector('form').addEventListener('submit', function(e){
          e.preventDefault();
      });
    });
}());
