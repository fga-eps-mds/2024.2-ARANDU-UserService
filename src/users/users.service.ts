import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoError } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CreateUserDtoFederated } from '../dtos/create-user-federated.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRole } from '../dtos/user-role.enum';
import { EmailService } from './email.service';
import { User } from './interface/user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) { }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, username, password } = createUserDto;
    const createdUser = new this.userModel({
      name,
      email,
      username,
      password,
      role: UserRole.ALUNO,
    });

    try {
      const user = await createdUser.save();
      await this.emailService.sendVerificationEmail(email);
      return user;
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        throw new ConflictException(
          'Duplicate value error: email or username already exists.',
        );
      }
      throw error;
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.getUserById(userId);

    if (updateUserDto.email) updateUserDto.isVerified = false;

    var updateAttr = Object.fromEntries(
      Object.entries(updateUserDto).filter(([value]) => value !== null)
    )

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { $set: updateAttr },
        {
          upsert: false,
          new: true
        }
      )

      if (updateAttr['isVerified'] === false) await this.emailService.sendVerificationEmail(updateAttr['email']);

      return updatedUser;

    } catch (error) {
      if (error instanceof MongoError) {
        throw new NotFoundException(`User with ID ${userId} not found!`)
      }
      throw error
    }
  }

  async createFederatedUser(
    createFederatedUserDto: CreateUserDtoFederated,
  ): Promise<any> {
    if (!createFederatedUserDto.password) {
      delete createFederatedUserDto.password;
    }

    const createdUser = new this.userModel(createFederatedUserDto);
    return createdUser.save();
  }

  async verifyUser(token: string): Promise<User> {
    const user = await this.userModel
      .findOne({ verificationToken: token })
      .exec();
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }
    user.verificationToken = undefined;
    user.isVerified = true;
    await user.save();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async getUserById(_id: string): Promise<User> {
    const user = await this.userModel.findById(_id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
    return user;
  }

  async addKnowledgeToUser(userId: string, knowledgeId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const objectId = new Types.ObjectId(knowledgeId);

    user.knowledges = (user.knowledges ? user.knowledges : [])

    if (!user.knowledges.includes(objectId)) user.knowledges.push(objectId);

    return user.save();
  }

  async addSubjectToUser(userId: string, subjectId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const objectId = new Types.ObjectId(subjectId);

    user.subjects = (user.subjects ? user.subjects : [])

    if (!user.subjects.includes(objectId)) user.subjects.push(objectId);

    return user.save();
  }

  async addJourneyToUser(userId: string, journeyId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(journeyId);

    if (!user.journeys) {
      user.journeys = [];
    }

    if (!user.journeys.includes(objectId)) {
      user.journeys.push(objectId);
    }

    return user.save();
  }

  async getCompletedTrails(userId: string): Promise<Types.ObjectId[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.completedTrails;
  }

  async completeTrail(userId: string, trailId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(trailId);

    const isTrailCompleted = user.completedTrails.some((completedTrailId) =>
      completedTrailId.equals(objectId),
    );

    if (isTrailCompleted) {
      throw new ConflictException(
        `User already completed trail with ID ${trailId}`,
      );
    }

    user.completedTrails.push(objectId);

    return user.save();
  }

  async deleteUserById(_id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
  }

  async subscribeJourney(userId: string, journeyId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(journeyId);
    if (user.subscribedJourneys && user.subscribedJourneys.includes(objectId)) {
      throw new ConflictException(
        `User already subscribed to journey with ID ${journeyId}`,
      );
    }

    if (!user.subscribedJourneys) {
      user.subscribedJourneys = [];
    }

    if (!user.subscribedJourneys.includes(objectId)) {
      user.subscribedJourneys.push(objectId);
    }

    return user.save();
  }

  async subscribeSubject(userId: string, subjectId: string): Promise<Partial<User>> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException(`Couldn't find user with ID ${userId}`);

    if (!user.subscribedSubjects) user.subscribedSubjects = [new Types.ObjectId(subjectId)];
    else if (!user.subscribedSubjects.includes(new Types.ObjectId(subjectId)))
      user.subscribedSubjects.push(new Types.ObjectId(subjectId));
    else throw new ConflictException(`User already subscribed at subject with ID ${subjectId}!`);

    const savedUser = await user.save();

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      username: savedUser.username,
      subscribedSubjects: savedUser.subscribedSubjects
    }
  }

  async unsubscribeJourney(userId: string, journeyId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(journeyId);

    if (user.subscribedJourneys) {
      user.subscribedJourneys = user.subscribedJourneys.filter(
        (id) => !id.equals(objectId),
      );
    }

    return user.save();
  }

  async unsubscribeSubject(userId: string, subjectId: string): Promise<Partial<User>> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException(`Couldn't find user with ID ${userId}`);

    const objectId = new Types.ObjectId(subjectId);

    if (!user.subscribedSubjects || !user.subscribedSubjects.includes(objectId))
      throw new NotFoundException(`User not subscribed at subject with ID ${subjectId}`)

    user.subscribedSubjects = user.subscribedSubjects.filter((id) => !id.equals(objectId))

    const savedUser = await user.save();

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      username: savedUser.username,
      subscribedSubjects: savedUser.subscribedSubjects
    }
  }

  async getSubscribedJourneys(userId: string): Promise<Types.ObjectId[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.subscribedJourneys;
  }

  async getSubscribedSubjects(userId: string): Promise<Types.ObjectId[]> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException(`Couldn't find user with ID ${userId}`);

    return user.subscribedSubjects;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateUserRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<User> {
    const { role } = updateRoleDto;
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    user.role = role;
    await user.save();
    return user;
  }
}
