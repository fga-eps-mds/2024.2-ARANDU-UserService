import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { UpdateRoleDto } from 'src/dtos/update-role.dto';
import { UserRole } from 'src/dtos/user-role.enum';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { UpdateUserDto } from '../src/dtos/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    _id: 'mockUserId',
    name: 'Mock User',
    email: 'mock@example.com',
    role: UserRole.ALUNO,
  };

  const mockUpdatedUser = {
    _id: 'mockUserId',
    name: 'Mock User',
    username: 'mockusername',
    email: 'mock@example.com',
    role: UserRole.ALUNO,
  }

  const mockSubscribedSubject = {
    _id: 'mocked-id',
    email: 'mocked-email',
    name: 'mocked-name',
    username: 'mocked-username',
    subscribedSubjects: ['mocked-subject']
  }

  const mockUnsubscribedSubject = {
    id: 'mocked-id',
    email: 'mocked-email',
    name: 'mocked-name',
    username: 'mocked-username',
    subscribedSubjects: []
  }

  const mockUserService = {
    createUser: jest.fn().mockResolvedValue(mockUser),
    verifyUser: jest.fn().mockResolvedValue(mockUser),
    updateUser: jest.fn().mockResolvedValue(mockUpdatedUser),
    getSubscribedJourneys: jest.fn().mockResolvedValue([]),
    getSubscribedSubjects: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue([mockUser]),
    addSubjectToUser: jest.fn().mockResolvedValue(mockUser),
    subscribeJourney: jest.fn().mockResolvedValue(mockUser),
    unsubscribeJourney: jest.fn().mockResolvedValue(mockUser),
    subscribeSubject: jest.fn().mockResolvedValue(mockSubscribedSubject),
    unsubscribeSubject: jest.fn().mockResolvedValue(mockUnsubscribedSubject),
    getUserById: jest.fn().mockResolvedValue(mockUser),
    deleteUserById: jest.fn().mockResolvedValue(undefined),
    updateUserRole: jest.fn().mockResolvedValue(mockUser),
  };

  const mockAuthService = {};
  const mockJwtService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      username: '',
    };
    await expect(controller.createUser(createUserDto)).resolves.toEqual({
      message: 'User created successfully. Please verify your email.',
    });
  });

  it('should update an user', async () => {
    const userId = 'mockUserId';

    const updateUserDto: UpdateUserDto = {
      name: 'Mock User',
      username: 'mockusername',
      email: 'mock@example.com'
    }

    const req = { userId: userId } as any;

    expect(await controller.updateUser(req, updateUserDto)).toEqual({
      message: `User ${mockUpdatedUser.username} updated successfully!`
    })
  })

  it('should subscribe to subject', async () => {
    const userId = 'mocked-id';
    const subjectId = 'mocked-subject';

    expect(await controller.subscribeSubject(userId, subjectId)).toBe(mockSubscribedSubject);
  })

  it('should return error when trying to subscribe to subject', async () => {
    const userId = 'false-id';
    const subjectId = 'mocked-subject';

    mockUserService.subscribeSubject.mockRejectedValueOnce(new NotFoundException(`Couldn't find user with ID ${userId}`));

    await expect(controller.subscribeSubject(userId, subjectId)).rejects.toBeInstanceOf(NotFoundException);
  })

  it('should unsubscribe to subject', async () => {
    const userId = 'mocked-id';
    const subjectId = 'mocked-subject';

    expect(await controller.unsubscribeSubject(userId, subjectId)).toBe(mockUnsubscribedSubject);
  })

  it('should return error when trying to unsubscribe to subject', async () => {
    const userId = 'false-id';
    const subjectId = 'mocked-subject';

    mockUserService.unsubscribeSubject.mockRejectedValueOnce(new NotFoundException(`Couldn't find user with ID ${userId}`));

    await expect(controller.unsubscribeSubject(userId, subjectId)).rejects.toBeInstanceOf(NotFoundException);
  })

  it('should return an error while trying to update user', async () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Mock User',
      username: 'mockusername',
      email: 'mock@example.com'
    }

    const req = { userId: 'idInexistente' } as any;

    mockUserService.updateUser.mockRejectedValueOnce(new NotFoundException("User with ID 'idInexistente' not found"));

    await expect(controller.updateUser(req, updateUserDto)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('should verify a user', async () => {
    const token = 'validToken';
    await expect(controller.verifyUser(token)).resolves.toEqual({
      message: 'Account verified successfully',
    });
  });

  it('should get subscribed journeys', async () => {
    const userId = 'mockUserId';
    await expect(controller.getSubscribedJourneys(userId)).resolves.toEqual([]);
  });

  it('should return error when trying to return subscribed subjects', async () => {
    const userId = 'false-id';

    mockUserService.getSubscribedSubjects.mockRejectedValueOnce(new NotFoundException(`User with ID ${userId} not found`));

    await expect(controller.getSubscribedSubjects(userId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should get subscribed subjects', async () => {
    const userId = 'mockUserId';
    await expect(controller.getSubscribedSubjects(userId)).resolves.toEqual([]);
  });

  it('should get all users', async () => {
    await expect(controller.getUsers()).resolves.toEqual([mockUser]);
  });

  it('should add a subject to a user', async () => {
    const userId = 'mockUserId';
    const subjectId = 'mockSubjectId';
    await expect(
      controller.addSubjectToUser(userId, subjectId),
    ).resolves.toEqual(mockUser);
  });

  it('should handle error when adding a subject to a user', async () => {
    const userId = 'mockUserId';
    const subjectId = 'mockSubjectId';
    mockUserService.addSubjectToUser.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(
      controller.addSubjectToUser(userId, subjectId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should get a user by ID', async () => {
    const userId = 'mockUserId';
    await expect(controller.getUserById(userId)).resolves.toEqual(mockUser);
  });

  it('should handle error when getting a user by ID', async () => {
    const userId = 'mockUserId';
    mockUserService.getUserById.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(controller.getUserById(userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a user by ID', async () => {
    const userId = 'mockUserId';
    await expect(controller.deleteUserById(userId)).resolves.toBeUndefined();
  });

  it('should handle error when deleting a user by ID', async () => {
    const userId = 'mockUserId';
    mockUserService.deleteUserById.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(controller.deleteUserById(userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a user role', async () => {
    const userId = 'mockUserId';
    const updateRoleDto: UpdateRoleDto = { role: UserRole.ADMIN };
    await expect(
      controller.updateUserRole(userId, updateRoleDto),
    ).resolves.toEqual({
      message: 'User role updated successfully',
      user: mockUser,
    });
  });

  it('should handle error when updating a user role', async () => {
    const userId = 'mockUserId';
    const updateRoleDto: UpdateRoleDto = { role: UserRole.ADMIN };
    mockUserService.updateUserRole.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(
      controller.updateUserRole(userId, updateRoleDto),
    ).rejects.toThrow(NotFoundException);
  });
});
