import { ApiProperty } from '@nestjs/swagger';


export class ApiResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data?: T;

  @ApiProperty({ required: false })
  error?: string | null;

  @ApiProperty()
  message: string;
}