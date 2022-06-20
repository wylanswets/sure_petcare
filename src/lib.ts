"use strict";

import * as r from "request";

const request = r.defaults({
    jar: true  // use cookies
    /*, proxy:"http://localhost:8888", strictSSL:false*/
});

export class SurePetcareApi {
  private readonly email_address: string;
  private readonly password: string;
  private readonly baseURL: string;
  private _loginCompleteCallbacks: ((err?) => void)[];
  private _loggedIn: boolean;
  private _loggingIn: boolean;
  private token: string | null;
  private pullingStatuses: boolean;
  private getStatusCallbacks: ((data: SurePetcareStatuses) => void)[];

  constructor(config: SurePetcareConfig) {
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

  login(callback: (err?) => void): void {
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
      } else if (response.statusCode === 200) {
        this.token = body.data.token;
        this._loginComplete();
      } else {
        console.log("Got an error");
        console.log(body);
      }
    });
  }

  _loginComplete(): void {
    this._loggedIn = true;
    this._loggingIn = false;
    for (const callback of this._loginCompleteCallbacks) {
      callback();
    }
    this._loginCompleteCallbacks = [];
  }

  getLockStatus(device_id: number, callback: (data: SurePetcareDevice) => void): void {
    this.getStatuses(data => {
      for (const device of data.data.devices) {
        if (device.id === device_id) {
          callback(device);
        }
      }
    });
  }

  setLock(device_id: number, lockState: SurePetcareLockState, callback: (data: any) => void) {
      this._makeAuthenticatedRequest({
          path: "/device/" + device_id + "/control",
          method: "PUT",
          json: { "locking": lockState }
      }, function (data: any) {
          callback(data);
      });
  }

  getStatuses(callback: (data: SurePetcareStatuses) => void): void {
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
    }, (data: string, err) => {
      const jsonData = JSON.parse(data) as SurePetcareStatuses;

      for (const callback of this.getStatusCallbacks) {
        callback(jsonData);
      }
      this.getStatusCallbacks = [];
      //Unlock so we can pull more in the future
      this.pullingStatuses = false;
    });
  }

  _makeAuthenticatedRequest(req: any, callback: (data, err?) => void) {
    if (!this._loggedIn) {
      // try again when we're logged in
      this.login((err?) => {
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
    request(req, (err: any, response, body) => {

      if (!err && response.statusCode == 200) {
        // var json = JSON.parse(body);
        callback(body);
      } else if (!err && (response.statusCode == 400 || response.statusCode == 401)) {
        console.log(body);
        // // our access token was rejected or expired - time to log in again
        // // try again when we're logged in
        // this.login(function(err) {
        //   if (err) return callback(null, err);
        //   self._makeAuthenticatedRequest(req, callback); // login successful - try again!
        // }.bind(this));
      } else {
        err = err || new Error("Invalid status code " + response.statusCode);
        // this._notifyError(err, response, body);
        callback(null, err);
      }
    });
  }

  translateBatteryToPercent(value: number): number {
    // 6 and higher is 100%
    // 5 is 0%
    //We will subtract 5 to normalize between 5 and 6, multiply by 100 to get a positive fractional number,
    //and round to the nearest whole number to take off trailing percentages.
    var num = Math.round((value - 5) * 100);
    //Only return 100 or less;
    return num > 100 ? 100 : num;
  }
}

export interface SurePetcareConfig {
  email_address: string;
  password: string;
}

export interface SurePetcareStatuses {
  data: SurePetcareStatusesData;
}

export interface SurePetcareStatusesData {
  devices: SurePetcareDevice[];
  households: SurePetcareHousehold[];
  pets: SurePetcarePet[];
  photos: SurePetcarePhoto[];
  tags: SurePetcareTags[];
  user: SurePetcareUser;
}

export interface SurePetcareDevice {
  id: number;
  product_id: number,
  household_id: number,
  name: string;
  serial_number: string;
  mac_address: string;
  version: string;
  created_at: string;
  updated_at: string;
  control: SurePetcareDeviceControl;
  status: SurePetcareDeviceStatus;
}

export interface SurePetcareDeviceControl {
  led_mode: number;
  pairing_mode: number;
}

export interface SurePetcareDeviceStatus extends SurePetcareDeviceControl {
  online: boolean;
  version: {
    device: SurePetcareDeviceVersion
  };
}

export interface SurePetcareDeviceVersion {
  hardware: number;
  firmware: number;
}

export interface SurePetcareHousehold {
  id: number;
  name: string;
  share_code: string;
  timezone_id: number;
  version: string;
  created_at: string;
  updated_at: string;
  users: SurePetcareUser[];
}

export interface SurePetcareUser {
  id: number;
  owner: boolean;
  write: boolean;
  version: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
  };
}

export interface SurePetcarePet {
  id: number;
  name: string;
  gender: 1;
  date_of_birth: string;
  weight: number;
  comments: string;
  household_id: string;
  spayed: number;
  breed_id: number;
  food_type_id: number;
  photo_id: number;
  species_id: number;
  tag_id: number;
  version: string;
  created_at: string;
  updated_at: string;
  conditions: SurePetcarePetCondition[];
  photo: SurePetcarePhoto;
  position: SurePetcarePosition;
  status: {
    activity: SurePetcarePosition;
  };
}

export interface SurePetcarePetCondition {
  id: number;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface SurePetcarePhoto {
  id: number;
  location: string;
  uploading_user_id: number;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface SurePetcarePosition {
  tag_id: number;
  device_id: number;
  where: SurePetcarePositionWhere;
  since: string;
}

export enum SurePetcarePositionWhere {
  Unknown = 0,
  Inside = 1,
  Outside = 2
}

export interface SurePetcareTags {
  id: number;
  tag: string;
  version: string;
  created_at: string;
  updated_at: string;
  supported_product_ids: number[];
}

export enum SurePetcareLockState {
  Unlocked = 0,
  LockPetsIn = 1,
  LockPetsOut = 2,
  LockBothWays = 3
}
