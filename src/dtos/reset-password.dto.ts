import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'jwt_reset_token',
    required: true
 })
  @IsString()
  resetToken: string;

  @ApiProperty({
    example: 'SenhaNova123',
    required: true
 })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  newPassword: string;
}
