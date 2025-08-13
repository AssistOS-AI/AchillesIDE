export class ClientService {
    constructor() {
        if (ClientService.instance) {
            return ClientService.instance;
        } else {
            ClientService.instance = this;
            return this;
        }
    }
}
