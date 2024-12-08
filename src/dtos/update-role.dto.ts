import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from './user-role.enum';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'professor',
    required: true
 })
  @IsEnum(UserRole)
  role: UserRole;
}
