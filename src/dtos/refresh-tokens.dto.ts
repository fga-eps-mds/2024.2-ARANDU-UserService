import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {

  @ApiProperty({
    example: 'jwt_refresh_token',
    required: true
 })
  @IsString()
  refreshToken: string;
}
