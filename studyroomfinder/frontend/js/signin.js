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
              api.signin(username, password);
          }
      }

      document.querySelector('#signin').addEventListener('click', function(e){
          document.querySelector("form [name=action]").value = 'Submit';
          submit();
      });

      document.querySelector('form').addEventListener('submit', function(e){
          e.preventDefault();
      });
    });
}());
