import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRole } from '../dtos/user-role.enum';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UsePipes(ValidationPipe)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.createUser(createUserDto);
      return {
        message: 'User created successfully. Please verify your email.',
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch('')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async updateUser(
    @Req() req,
    @Body() body: UpdateUserDto
  ) {
    try {
      const user = await this.usersService.updateUser(req.userId, body)

      return {
        message: `User ${user.username} updated successfully!`
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`User with ID ${req.userId} not found`);
      }
      throw error;
    }
  }

  @Get('verify')
  async verifyUser(@Query('token') token: string) {
    const user = await this.usersService.verifyUser(token);
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }
    return {
      message: 'Account verified successfully',
    };
  }

  @Get(':userId/subscribedJourneys')
  async getSubscribedJourneys(
    @Param('userId') userId: string,
  ): Promise<Types.ObjectId[]> {
    return await this.usersService.getSubscribedJourneys(userId);
  }

  @Get(':userId/subscribedSubjects')
  async getSubscribedSubjects(@Param('userId') userId: string): Promise<Types.ObjectId[]> {
    return await this.usersService.getSubscribedSubjects(userId);
  }

  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }

  @Put(':id/subjects/:subjectId/add')
  async addSubjectToUser(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
  ) {
    try {
      return await this.usersService.addSubjectToUser(id, subjectId);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id/knowledges/:knowledgeId/add')
  async addKnowledgeToUser(
    @Param('id') id: string,
    @Param('knowledgeId') knowledgeId: string,
  ) {
    try {
      return await this.usersService.addKnowledgeToUser(id, knowledgeId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/subjects/subscribe/:subjectId')
  async subscribeSubject(
    @Param('userId') userId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return await this.usersService.subscribeSubject(userId, subjectId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId/subjects/unsubscribe/:subjectId')
  async unsubscribeSubject(
    @Param('userId') userId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.usersService.unsubscribeSubject(userId, subjectId);
  }


  @UseGuards(JwtAuthGuard)
  @Post(':userId/subscribe/:journeyId')
  async subscribeJourney(
    @Param('userId') userId: string,
    @Param('journeyId') journeyId: string,
  ) {
    return this.usersService.subscribeJourney(userId, journeyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId/unsubscribe/:journeyId')
  async unsubscribeJourney(
    @Param('userId') userId: string,
    @Param('journeyId') journeyId: string,
  ) {
    return this.usersService.unsubscribeJourney(userId, journeyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/complete/:trailId')
  async completeTrail(
    @Param('userId') userId: string,
    @Param('trailId') trailId: string,
  ) {
    return this.usersService.completeTrail(userId, trailId);
  }

  @Get(':userId/completedTrails')
  async getCompletedTrails(
    @Param('userId') userId: string,
  ): Promise<Types.ObjectId[]> {
    return await this.usersService.getCompletedTrails(userId);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    try {
      return await this.usersService.getUserById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete('/:id')
  async deleteUserById(@Param('id') id: string): Promise<void> {
    try {
      await this.usersService.deleteUserById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      const updatedUser = await this.usersService.updateUserRole(
        id,
        updateRoleDto,
      );
      return {
        message: 'User role updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
