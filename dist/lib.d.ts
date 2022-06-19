export declare class SurePetcareApi {
    private readonly email_address;
    private readonly password;
    private readonly baseURL;
    private _loginCompleteCallbacks;
    private _loggedIn;
    private _loggingIn;
    private token;
    private pullingStatuses;
    private getStatusCallbacks;
    constructor(config: SurePetcareConfig);
    login(callback: (err?: any) => void): void;
    _beginLogin(): void;
    _loginComplete(): void;
    getLockStatus(device_id: number, callback: (data: SurePetcareDevice) => void): void;
    setLock(device_id: number, lockState: SurePetcareLockState, callback: (data: any) => void): void;
    getStatuses(callback: (data: SurePetcareStatuses) => void): void;
    _makeAuthenticatedRequest(req: any, callback: (data: any, err?: any) => void): void;
    translateBatteryToPercent(value: number): number;
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
    product_id: number;
    household_id: number;
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
        device: SurePetcareDeviceVersion;
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
export declare enum SurePetcarePositionWhere {
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
export declare enum SurePetcareLockState {
    Unlocked = 0,
    LockPetsIn = 1,
    LockPetsOut = 2,
    LockBothWays = 3
}
