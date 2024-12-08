import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ChangePasswordDto } from 'src/dtos/change-password.dto';
import { ForgotPasswordDto } from 'src/dtos/forgot-password.dto';
import { LoginDto } from 'src/dtos/login.dto';
import { RefreshTokenDto } from 'src/dtos/refresh-tokens.dto';
import { ResetPasswordDto } from 'src/dtos/reset-password.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log('AuthController - Login Request:', loginDto);

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    this.logger.log('AuthController - Google Auth Initiated');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.logger.log('AuthController - Google Callback Request:', req.user);
    this.authService.redirectFederated(req.user as any, res);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    this.logger.log('AuthController - Microsoft Auth Initiated');
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  microsoftAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.logger.log(
      'AuthController - Microsoft Callback Request:',
      JSON.stringify(req.user),
    );
    this.authService.redirectFederated(req.user as any, res);
  }

  @Get('validate-token')
  async validateToken(@Req() req: Request) {
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const payload = await this.authService.validateToken(token);

    return {
      accessToken: token,
      userPayload: payload,
    };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    return request.headers.authorization?.split(' ')[1];
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(
      req.userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Put('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
