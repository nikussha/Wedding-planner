import { IsIn } from 'class-validator';
import { ROLES, Role } from '../../common/enums/role.enum';

export class UpdateUserRoleDto {
  @IsIn(ROLES)
  role!: Role;
}
