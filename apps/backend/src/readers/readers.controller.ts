import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { ReadersService } from './readers.service';

/** 남의 프로필을 볼 일이 없는 앱이라, 길에 id가 오지 않고 언제나 me다. */
@Controller('readers')
@UseGuards(JwtAuthGuard)
export class ReadersController {
  constructor(private readonly readers: ReadersService) {}

  @Get('me')
  find(@CurrentReader() readerId: string) {
    return this.readers.find(readerId);
  }

  @Patch('me')
  update(@CurrentReader() readerId: string, @Body() dto: UpdateReaderDto) {
    return this.readers.update(readerId, dto);
  }
}
