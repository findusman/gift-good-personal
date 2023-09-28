import { IsString, IsEmail, IsNotEmpty } from "class-validator";

export class registrationDto {
  @IsNotEmpty()
  @IsString()
  first_name;

  @IsNotEmpty()
  @IsString()
  last_name;

  @IsNotEmpty()
  @IsString()
  job;

  @IsNotEmpty()
  @IsString()
  company;

  @IsNotEmpty()
  @IsEmail()
  email;

  @IsNotEmpty()
  @IsString()
  password;
}

export class loginDto {
  @IsNotEmpty()
  @IsEmail()
  email;

  @IsNotEmpty()
  @IsString()
  password;
}

export class forgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  password;
}

export class resendInvitationDto {
  @IsNotEmpty()
  @IsEmail()
  email;
}
