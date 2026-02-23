import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    const accountId = this.configService.get('ZOOM_ACCOUNT_ID');
    const clientId = this.configService.get('ZOOM_CLIENT_ID');
    const clientSecret = this.configService.get('ZOOM_CLIENT_SECRET');

    if (!accountId || !clientId || !clientSecret) {
      throw new BadRequestException('Zoom credentials not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      { headers: { Authorization: `Basic ${credentials}` } },
    );

    return response.data.access_token;
  }

  async createMeeting(params: {
    topic: string;
    startTime: Date;
    duration: number;
    agenda?: string;
    hostEmail?: string;
  }): Promise<{ meetingId: string; joinUrl: string; startUrl: string; password: string }> {
    const accessToken = await this.getAccessToken();
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: params.topic,
        type: 2,
        start_time: params.startTime.toISOString(),
        duration: params.duration,
        agenda: params.agenda || '',
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          auto_recording: 'none',
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
    );

    return {
      meetingId: response.data.id.toString(),
      joinUrl: response.data.join_url,
      startUrl: response.data.start_url,
      password: response.data.password,
    };
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async getMeeting(meetingId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }
}
