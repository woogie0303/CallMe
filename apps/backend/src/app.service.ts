import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok' as const,
      service: 'callme-api',
      uptime: Math.round(process.uptime()),
    };
  }
}
