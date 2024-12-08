import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'nome@dominio.com',
    required: true
 })
  @IsEmail()
  email: string;
}
