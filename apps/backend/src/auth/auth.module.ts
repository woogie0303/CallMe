import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Reader, ReaderSchema } from '../readers/reader.schema';
import { AuthController } from './auth.controller';
import { DevLoginController } from './dev-login.controller';
import { AuthService } from './auth.service';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import { TokenService } from './token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reader.name, schema: ReaderSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(config.get('ACCESS_TOKEN_TTL_SECONDS') ?? 60 * 15),
        },
      }),
    }),
  ],
  controllers: [AuthController, DevLoginController],
  providers: [AuthService, TokenService],
  /** 가드가 JwtService를, 다른 모듈이 소유 검사를 위해 이 둘을 쓴다 */
  exports: [JwtModule, AuthService, TokenService],
})
export class AuthModule {}
