/**
Library for interfacing the modules in the Platform for Argument and Dialogue (PAD)
(c) 2020 Centre for Argument Technology
Licensed under the GNU Lesser GPL
**/

const pad = (function(location="http://localhost"){

  const loaded_modules = Array();
  let url = (location.substring(0,4)!="http") ? "http://" + location : location;
  let auth_token = null;

  function call_module(name, u, method, data, callback){
    let a = {
      url: url + "/" + name + "/v1" + u,
      method: method,
      error: function(request, textStatus, errorThrown){
        console.log(request);
      }
    };

    if(method == "POST" || method == "PUT"){
      a.data = JSON.stringify(data);
    }

    if(auth_token != null){
      a.beforeSend = function(xhr){
        xhr.setRequestHeader("X-AUTH-TOKEN", auth_token);
      };
    }
    $.ajax(a).done(callback);
  }

  return{

    set_location: function(u){
      if(u.substring(0,4)!="http"){
        u = "http://" + u;
      }
      url = u;
    },

    set_auth_token: function(t){
      auth_token = t;
    },

    load_module: function(name, version="1"){
      let m = {_name: name};
      loaded_modules.push(m);

      $.get(url + "/" + name + "/v" + version.split(".")[0] + "/_methods", function(data){
         for(let [func, options] of Object.entries(data)){

           options = options["options"];

           let parts = func.split("/");
           let parameters = [];

           let url_replace = Array();
           let s = Array();

           for(var i=1;i<parts.length;i++){
             let p = parts[i];
             if(p.charAt(0) == "<"){
               let param = p.substring(1, p.length-1);
               parameters.push(param);
               url_replace.push('url = url.replace("' + p + '", ' + param + ')');
             }else{
               s.push(p);
             }
           }
           let signature = s.join("_");
           url_replace = url_replace.join(";\n");

           for(const o of options["methods"]){
             let tmp_param = parameters;

             if(o == "POST" || o == "PUT"){
               tmp_param.push("data");
             }
             tmp_param.push("callback");
             if(o == "GET"){
               tmp_param.push("data={}");
             }

             let def = "m." + signature + " = function(" + tmp_param.join(",") + ")";

              eval(def + "{\
                  let url = \"" + func + "\";\
                  " + url_replace + ";\
                  call_module(name, url, \"" + o + "\", data, callback);\
              };");
           }

         }
         m.ready = true
      });

      return m;
    },

    ready: function(callback){
      let ready = true;
      let m = Array();

      for(const m of loaded_modules){
        if(!m.ready){
          ready = false;
          break;
        }
      }

      if(ready){
        console.log("pad.js loaded and connected to " + url)
        callback();
      }else{
        let _this = this;
        setTimeout(() => {
          _this.ready(callback);
        }, 1000);
      }
    }
  }

});
