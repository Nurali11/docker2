import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  about: string;

  @ApiProperty()
  @IsInt()
  @Max(100000)
  @Min(10)
  price: number;

  @ApiProperty()
  @IsString()
  @IsUUID()
  authorId: string;
}
