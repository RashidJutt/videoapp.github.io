import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

export type Devices = MediaDeviceInfo[];

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
    $devicesUpdated: Observable<Promise<Devices>>;

    private deviceBroadcast = new ReplaySubject<Promise<Devices>>();

    constructor() {
        if (navigator && navigator.mediaDevices) {
            navigator.mediaDevices.ondevicechange = (_: Event) => {
                this.deviceBroadcast.next(this.getDeviceOptions());
            }
        }

        this.$devicesUpdated = this.deviceBroadcast.asObservable();
        this.deviceBroadcast.next(this.getDeviceOptions());
    }

    private async isGrantedMediaPermissions() {
        if (navigator && navigator.userAgent && navigator.userAgent.indexOf('Chrome') < 0) {
            return true; // Follows standard workflow for non-Chrome browsers.
        }

        
            try {
              const hasPermission = await navigator.mediaDevices.getUserMedia({ video: true });
              if (hasPermission) {
                return true;
              }
              // if not, ask for permission
              const permission = await navigator.mediaDevices.getUserMedia({ video: true });
              if (permission) {
                return true;
              }
              return false;                
                
            } catch (e) {
                // This is only currently supported in Chrome.
                // https://stackoverflow.com/a/53155894/2410379
                return true;
            }
    }

    private async getDeviceOptions(): Promise<Devices> {
        const isGranted = await this.isGrantedMediaPermissions();
        if (navigator && navigator.mediaDevices && isGranted) {
            let devices = await this.tryGetDevices();
            if (devices.every(d => !d.label)) {
                devices = await this.tryGetDevices();
            }
            return devices.filter(d => !!d.label);
        }

        return null;
    }

    private async tryGetDevices() {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const devices = ['audioinput', 'audiooutput', 'videoinput'].reduce((options, kind) => {
            return options[kind] = mediaDevices.filter(device => device.kind === kind);
        }, [] as Devices);

        return devices;
    }
}
