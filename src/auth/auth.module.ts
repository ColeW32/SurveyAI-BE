import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: '9e4f36b2ad0e453c84a5ff5f02de1c7caa92d394fe7c4bc2808b3e3a7d59c140c01de929c7d7a5bd0fcd9b452b4416a07cbf28d73e1b11dfe9379dbad73fdb34',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule { }