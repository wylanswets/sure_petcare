"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurePetcareLockState = exports.SurePetcarePositionWhere = exports.SurePetcareApi = void 0;
const r = require("request");
const request = r.defaults({
    jar: true // use cookies
    /*, proxy:"http://localhost:8888", strictSSL:false*/
});
class SurePetcareApi {
    constructor(config) {
        this.email_address = config.email_address;
        this.password = config.password;
        this.baseURL = 'https://app.api.surehub.io/api';
        // interested parties in us being logged in
        this._loginCompleteCallbacks = [];
        this._loggedIn = false;
        this._loggingIn = false;
        this.token = null;
        this.pullingStatuses = false;
        this.getStatusCallbacks = [];
    }
    login(callback) {
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
    _beginLogin() {
        request.post(this.baseURL + "/auth/login", {
            json: {
                "email_address": this.email_address,
                "password": this.password,
                "device_id": this.email_address
            }
        }, (err, response, body) => {
            if (err || response.statusCode === undefined) {
                console.log("Login failed.");
                console.log(body);
                console.log(err);
                for (const callback of this._loginCompleteCallbacks) {
                    callback(err);
                }
                this._loginCompleteCallbacks = [];
            }
            else if (response.statusCode === 200) {
                this.token = body.data.token;
                this._loginComplete();
            }
            else {
                console.log("Got an error");
                console.log(body);
            }
        });
    }
    _loginComplete() {
        this._loggedIn = true;
        this._loggingIn = false;
        for (const callback of this._loginCompleteCallbacks) {
            callback();
        }
        this._loginCompleteCallbacks = [];
    }
    getLockStatus(device_id, callback) {
        this.getStatuses(data => {
            for (const device of data.data.devices) {
                if (device.id === device_id) {
                    callback(device);
                }
            }
        });
    }
    setLock(device_id, lockState, callback) {
        this._makeAuthenticatedRequest({
            path: "/device/" + device_id + "/control",
            method: "PUT",
            json: { "locking": lockState }
        }, function (data) {
            callback(data);
        });
    }
    getStatuses(callback) {
        this.getStatusCallbacks.push(callback);
        if (this.pullingStatuses === true) {
            //Wait until we have states
            return;
        }
        //Lock so only one request happens at a time
        this.pullingStatuses = true;
        this._makeAuthenticatedRequest({
            path: "/me/start",
            method: "GET"
        }, (data, err) => {
            const jsonData = JSON.parse(data);
            for (const callback of this.getStatusCallbacks) {
                callback(jsonData);
            }
            this.getStatusCallbacks = [];
            //Unlock so we can pull more in the future
            this.pullingStatuses = false;
        });
    }
    _makeAuthenticatedRequest(req, callback) {
        if (!this._loggedIn) {
            // try again when we're logged in
            this.login((err) => {
                if (err) {
                    return callback(null, err);
                }
                this._makeAuthenticatedRequest(req, callback); // login successful - try again!
            });
            return;
        }
        if (req.path !== undefined) {
            //Translate from just the path to the full URL
            req.url = this.baseURL + req.path;
        }
        req.auth = { bearer: this.token };
        req.headers = req.headers || {};
        // var self = this;
        request(req, (err, response, body) => {
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
        });
    }
    translateBatteryToPercent(value) {
        // 6 and higher is 100%
        // 5 is 0%
        //We will subtract 5 to normalize between 5 and 6, multiply by 100 to get a positive fractional number,
        //and round to the nearest whole number to take off trailing percentages.
        var num = Math.round((value - 5) * 100);
        //Only return 100 or less;
        return num > 100 ? 100 : num;
    }
}
exports.SurePetcareApi = SurePetcareApi;
var SurePetcarePositionWhere;
(function (SurePetcarePositionWhere) {
    SurePetcarePositionWhere[SurePetcarePositionWhere["Unknown"] = 0] = "Unknown";
    SurePetcarePositionWhere[SurePetcarePositionWhere["Inside"] = 1] = "Inside";
    SurePetcarePositionWhere[SurePetcarePositionWhere["Outside"] = 2] = "Outside";
})(SurePetcarePositionWhere = exports.SurePetcarePositionWhere || (exports.SurePetcarePositionWhere = {}));
var SurePetcareLockState;
(function (SurePetcareLockState) {
    SurePetcareLockState[SurePetcareLockState["Unlocked"] = 0] = "Unlocked";
    SurePetcareLockState[SurePetcareLockState["LockPetsIn"] = 1] = "LockPetsIn";
    SurePetcareLockState[SurePetcareLockState["LockPetsOut"] = 2] = "LockPetsOut";
    SurePetcareLockState[SurePetcareLockState["LockBothWays"] = 3] = "LockBothWays";
})(SurePetcareLockState = exports.SurePetcareLockState || (exports.SurePetcareLockState = {}));
