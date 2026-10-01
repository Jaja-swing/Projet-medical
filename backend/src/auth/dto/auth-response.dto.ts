import { Role } from '../../common/enums/role.enum';

/** Reponse d'authentification : ne contient jamais le mot de passe. */
export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}
