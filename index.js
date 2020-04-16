var request = require('request').defaults({jar: true/*, proxy:"http://localhost:8888", strictSSL:false*/}); // use cookies

module.exports = {
    SurePetcareApi: SurePetcareApi
}
  
function SurePetcareApi(config) {
    this.email_address = config.email_address;
    this.password = config.password;

    this.baseURL = 'https://app.api.surehub.io/api';


    // interested parties in us being logged in
    this._loginCompleteCallbacks = [];
    this._loggedIn = false;
    this._loggingIn = false;

    this.token = null;


}

SurePetcareApi.prototype.login = function(callback) {
    // queue this callback for when we're finished logging in
    if (callback) {
        this._loginCompleteCallbacks.push(callback);
    }
        
    // begin logging in if we're not already doing so
    if (!this._loggingIn) {
        this._loggingIn = true;
        this._beginLogin();
    }
}

SurePetcareApi.prototype._beginLogin = function() {
    var self = this;
    request.post(this.baseURL + "/auth/login", {
        json: {
          "email_address": self.email_address,
          "password": self.password,
          "device_id": self.email_address
        }
      }, function (err, response, body) {
        
      if(response.statusCode === 200) {
        
        this.token = body.data.token;
  
        this._loginComplete();
  
      } else {
        console.log("Got an error");
        console.log(body);
      }
  
  
    }.bind(this));
}

SurePetcareApi.prototype._loginComplete = function(err) {
    var self = this;
    self._loggedIn = true;
    self._loggingIn = false;
    self._loginCompleteCallbacks.forEach(function(callback) { callback(err); });
    self._loginCompleteCallbacks = [];
}

SurePetcareApi.prototype.getLockStatus = function(device_id, callback) {
    // Lock Modes:
    // 0 = unlocked
    // 1 = Lock pets in
    // 2 = Lock pets out
    // 3 = Lock both ways

    this.getStatuses(function(data) {

        var devs = [];

        for(index in data.data.devices) {
            if(data.data.devices[index].id == device_id) {
                callback(data.data.devices[index]);
            }
        }
    });

}

SurePetcareApi.prototype.setLock = function(device_id, lockState, callback) {
    // Lock Modes:
    // 0 = unlocked
    // 1 = Lock pets in
    // 2 = Lock pets out
    // 3 = Lock both ways
    this._makeAuthenticatedRequest({
        path: "/device/" + device_id + "/control",
        method: "PUT",
        json: {"locking": lockState}
    }, function(data) {
        callback(data);
    });
}

SurePetcareApi.prototype.getStatuses = function(callback) {
    this._makeAuthenticatedRequest({
        path: "/me/start",
        method: "GET"
    }, function(data) {
        data = JSON.parse(data);

        callback(data);

        
    });
}

SurePetcareApi.prototype._makeAuthenticatedRequest = function(req, callback) {
    
    if (!this._loggedIn) {
        // try again when we're logged in
        this.login(function(err) {
            if (err) return callback(null, err);
            this._makeAuthenticatedRequest(req, callback); // login successful - try again!
        }.bind(this));

        return;
    }

    if(req.path !== undefined) {
        //Translate from just the path to the full URL
        req.url = this.baseURL + req.path;
    }
    
    req.auth = {bearer:this.token};
    req.headers = req.headers || {};

    // var self = this;

    request(req, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            // var json = JSON.parse(body);
            callback(body);
          }
          else if (!err && (response.statusCode == 400 || response.statusCode == 401)) {
              console.log(body);
            // // our access token was rejected or expired - time to log in again
            // // try again when we're logged in
            // this.login(function(err) {
            //   if (err) return callback(null, err);
            //   self._makeAuthenticatedRequest(req, callback); // login successful - try again!
            // }.bind(this));
          }
          else {
            err = err || new Error("Invalid status code " + response.statusCode);
            // this._notifyError(err, response, body);
            callback(null, err);
          }
    }.bind(this));
}