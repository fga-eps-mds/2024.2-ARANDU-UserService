import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/interface/user.schema';
import { RefreshTokenSchema } from 'src/users/interface/refresh-token.schema';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: {
        expiresIn: '60m',
      },
    }),
    UsersModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema }, 
    ]),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, MicrosoftStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule, AuthService],
})
export class AuthModule {}
