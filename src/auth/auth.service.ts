import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject();
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      sub: user._id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    this.logger.log('AuthService - Generated Token:', token);
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      accessToken: token,
    };
  }

  getJwtService() {
    return this.jwtService;
  }
}