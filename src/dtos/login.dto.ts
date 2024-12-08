import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: 'nome@dominio.com',
    required: true
 })
  readonly email: string;

  @ApiProperty({
    example: 'Senha123',
    required: true
 })
  readonly password: string;
}
