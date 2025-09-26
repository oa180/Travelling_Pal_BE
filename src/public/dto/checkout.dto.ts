import { IsInt } from 'class-validator';

export class CheckoutDto {
  @IsInt()
  bookingId!: number;
}
