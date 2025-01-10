import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Nome',
    required: true,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'nome@dominio.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Username',
    required: true,
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'Senha123',
    required: true,
  })
  @IsNotEmpty()
  password: string;
}
