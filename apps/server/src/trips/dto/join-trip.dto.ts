import { IsString, MinLength } from 'class-validator';

export class JoinTripDto {
  @IsString()
  @MinLength(1)
  inviteCode: string;
}
