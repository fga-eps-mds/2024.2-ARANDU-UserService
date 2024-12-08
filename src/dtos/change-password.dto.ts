import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {

  @ApiProperty({
    example: 'SenhaAntiga123',
    required: true
 })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: 'SenhaNova123',
    required: true
 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
