import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto);
  }
}
