import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {

    @ApiProperty({
        example: 'Nome',
        required: false
    })
    @IsString()
    @MinLength(3)
    @IsOptional()
    name?: string

    @ApiProperty({
        example: 'Username',
        required: false
    })
    @IsString()
    @MinLength(3)
    @IsOptional()
    username?: string

    @ApiProperty({
        example: 'email@email.com',
        required: false
    })
    @IsEmail()
    @IsOptional()
    email?: string

    @IsBoolean()
    @IsOptional()
    isVerified?: boolean

}
