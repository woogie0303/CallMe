import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AccountDeletionService } from './account-deletion.service';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { ReadersService } from './readers.service';

/** 남의 프로필을 볼 일이 없는 앱이라, 길에 id가 오지 않고 언제나 me다. */
@Controller('readers')
@UseGuards(JwtAuthGuard)
export class ReadersController {
  constructor(
    private readonly readers: ReadersService,
    private readonly deletion: AccountDeletionService,
  ) {}

  @Get('me')
  find(@CurrentReader() readerId: string) {
    return this.readers.find(readerId);
  }

  @Patch('me')
  update(@CurrentReader() readerId: string, @Body() dto: UpdateReaderDto) {
    return this.readers.update(readerId, dto);
  }

  /** 계정 삭제 — 책·문장·표현·질문·읽은 기록·토큰까지 전부. 되돌릴 수 없다. */
  @Delete('me')
  @HttpCode(204)
  async remove(@CurrentReader() readerId: string): Promise<void> {
    await this.deletion.remove(readerId);
  }
}
