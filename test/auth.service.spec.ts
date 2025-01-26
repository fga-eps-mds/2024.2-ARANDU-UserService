import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/users/email.service';
import { RefreshToken } from 'src/users/interface/refresh-token.schema';
import { ResetToken } from 'src/users/interface/reset-token.schema';
import { User } from 'src/users/interface/user.interface';
import { UsersService } from 'src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;
  let refreshTokenModel: Model<RefreshToken>;
  let resetTokenModel: Model<ResetToken>;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: {
            findById: jest.fn(),
            findOne: jest.fn(),
            findOneAndDelete: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: {
            updateOne: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(ResetToken.name),
          useValue: {
            create: jest.fn(),
            findOneAndDelete: jest.fn(),
          },
        },
        UsersService,
        JwtService,
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken('User'));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    resetTokenModel = module.get(getModelToken(ResetToken.name));
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return user data with tokens', async () => {
      const user = {
        _id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      jest.spyOn(service, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.login(user);
      expect(result).toEqual({
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('loginFederated', () => {
    it('should create a new user and return tokens', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const user = { _id: 'user-id', name, email, role: 'user' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(usersService, 'createFederatedUser')
        .mockResolvedValue(user as any);
      jest.spyOn(service, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.loginFederated({ email, name });
      expect(result).toEqual({
        user,
        token: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      });
    });
  });

  describe('generateTokens', () => {
    it('should return access and refresh tokens', async () => {
      jest.spyOn(jwtService, 'sign').mockReturnValue('access-token');
      jest.spyOn(service, 'storeRefreshToken').mockResolvedValue(undefined);

      const result = await service.generateTokens({
        userId: 'user-id',
        id: 'user-id',
        name: 'Test User',
        username: 'username',
        email: 'test@example.com',
        role: 'user',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
      });
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token in the database', async () => {
      jest.spyOn(refreshTokenModel, 'updateOne').mockResolvedValue({} as any);
      const result = await service.storeRefreshToken(
        'refresh-token',
        'user-id',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens', async () => {
      const token = { userId: 'user-id', expiryDate: new Date() };
      jest.spyOn(refreshTokenModel, 'findOne').mockResolvedValue(token as any);
      jest.spyOn(usersService, 'findById').mockResolvedValue({
        _id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      } as any);
      jest.spyOn(service, 'generateTokens').mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await service.refreshTokens('refresh-token');
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });
  });

  describe('changePassword', () => {
    it('should change the user password', async () => {
      const userId = 'user-id';
      const oldPassword = 'old-password';
      const newPassword = 'new-password';
      const hashedPassword = await bcrypt.hash(oldPassword, 10);
      const user = { _id: userId, password: hashedPassword, save: jest.fn() };
      jest.spyOn(userModel, 'findById').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await service.changePassword(userId, oldPassword, newPassword);
      expect(user.password).toBe(newPassword);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(
        service.changePassword('user-id', 'old-password', 'new-password'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('redirectFederated', () => {
    it('should redirect with tokens', () => {
      const user = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const res = { redirect: jest.fn() } as any;
      jest.spyOn(configService, 'get').mockReturnValue('http://frontend-url');

      service.redirectFederated(user, res);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://frontend-url/oauth?token=access-token&refresh=refresh-token',
      );
    });

    it('should redirect to cadastro if no access token', () => {
      const user = {};
      const res = { redirect: jest.fn() } as any;
      jest.spyOn(configService, 'get').mockReturnValue('http://frontend-url');

      service.redirectFederated(user, res);
      expect(res.redirect).toHaveBeenCalledWith('http://frontend-url/cadastro');
    });
  });

  describe('forgotPassword', () => {
    it('should send a reset password email and create a reset token', async () => {
      const email = 'test@example.com';
      const user = { _id: 'user-id', email };
      const resetToken = 'reset-token'; // Isso pode ser ajustado conforme necessário
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(resetTokenModel, 'create').mockResolvedValue({
        token: resetToken,
        userId: user._id,
        expiryDate,
      } as any);
      jest
        .spyOn(emailService, 'sendPasswordResetEmail')
        .mockImplementation(() => Promise.resolve());

      const result = await service.forgotPassword(email);

      expect(result).toEqual({
        message: 'Check your email, you will receive an redirect link',
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        expect.any(String), // Aqui estamos esperando qualquer string para o token
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset the user password', async () => {
      const newPassword = 'new-password';
      const resetToken = 'reset-token';
      const user = {
        _id: 'user-id',
        password: 'old-password',
        save: jest.fn(),
      };
      const tokenData = {
        userId: user._id,
        expiryDate: new Date(),
      };

      jest
        .spyOn(resetTokenModel, 'findOneAndDelete')
        .mockResolvedValue(tokenData as any);
      jest.spyOn(userModel, 'findById').mockResolvedValue(user as any);

      await service.resetPassword({ newPassword, resetToken });

      expect(user.password).toBe(newPassword);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      jest.spyOn(resetTokenModel, 'findOneAndDelete').mockResolvedValue(null);

      await expect(
        service.resetPassword({
          newPassword: 'new-password',
          resetToken: 'invalid-token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const resetToken = 'reset-token';
      const newPassword = 'new-password';
      jest.spyOn(resetTokenModel, 'findOneAndDelete').mockResolvedValue({
        userId: 'user-id',
        expiryDate: new Date(),
      } as any);
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(
        service.resetPassword({ newPassword, resetToken }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateToken', () => {
    it('should return user information if token is valid', async () => {
      const token = 'valid-token';
      const payload = {
        userId: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);

      const result = await service.validateToken(token);

      expect(result).toEqual({
        userId: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const token = 'invalid-token';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const tokenData = { userId: 'user-id', expiryDate: new Date() };
      const user = {
        _id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      jest
        .spyOn(refreshTokenModel, 'findOne')
        .mockResolvedValue(tokenData as any);
      jest.spyOn(usersService, 'findById').mockResolvedValue(user as any);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(newTokens);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      jest.spyOn(refreshTokenModel, 'findOne').mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        TypeError,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const refreshToken = 'expired-refresh-token';
      const expiredTokenData = {
        userId: 'user-id',
        expiryDate: new Date(Date.now() - 1000), // 1 second in the past
      };

      jest
        .spyOn(refreshTokenModel, 'findOne')
        .mockResolvedValue(expiredTokenData as any);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        TypeError,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user data without password if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        _id: 'user-id',
        name: 'Test User',
        email: email,
        password: hashedPassword,
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          name: 'Test User',
          email: email,
          password: hashedPassword,
        }),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        _id: 'user-id',
        name: 'Test User',
        email: email,
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrong-password';
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      const user = {
        _id: 'user-id',
        name: 'Test User',
        email: email,
        password: hashedPassword,
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          name: 'Test User',
          email: email,
          password: hashedPassword,
        }),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
