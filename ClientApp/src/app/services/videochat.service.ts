import { connect, ConnectOptions, LocalTrack, Room } from 'twilio-video';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject , Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface AuthToken {
    token: string;
}

export interface NamedRoom {
    id: string;
    name: string;
    maxParticipants?: number;
    participantCount: number;
}

export type Rooms = NamedRoom[];

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {
    $roomsUpdated: Observable<boolean>;

    private roomBroadcast = new ReplaySubject<boolean>();
    private rootUrl;
    constructor(private readonly http: HttpClient) {
        this.$roomsUpdated = this.roomBroadcast.asObservable();
        this.rootUrl=environment.apiUrl+'video/';
    }

    private async getAuthToken() {
        
        const auth =
            await this.http
                      .get<string>(`${this.rootUrl}token`)
                      .toPromise();
        console.log(auth);
        return auth;
    }

    getAllRooms() {
        return this.http
                   .get<Rooms>(this.rootUrl+'rooms')
                   .toPromise();
    }

    async joinOrCreateRoom(name: string, tracks: LocalTrack[]) {
        let room: Room = null;
        try {
            const token = await this.getAuthToken();
            console.log(token);
            room =
                await connect(
                    token, {
                        name,
                        tracks,
                        dominantSpeaker: true
                    } as ConnectOptions);
        } catch (error) {
            console.error(`Unable to connect to Room: ${error.message}`);
        } finally {
            if (room) {
                this.roomBroadcast.next(true);
            }
        }

        return room;
    }

    nudge() {
        this.roomBroadcast.next(true);
    }
}
