import { User } from "./user.interface";

export class UserModel implements User {
    licenseKey: string;
    sandboxKey: string;
    apiKey: string;

    constructor(values: User) {
        this.licenseKey = values.licenseKey || '';
        this.sandboxKey = values.sandboxKey || '';
        this.apiKey = values.apiKey || '';
    }
}