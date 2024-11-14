import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserModuleController } from './list/user-module.controller';
import { TokenService } from './token/token.service';
import { UsersController } from './user/users.controller';
import { UsersService } from './user/users.service';

@Module({
    controllers: [UsersController, UserModuleController],
    imports: [forwardRef(() => AuthModule)],

    providers: [
        // services
        UsersService,
        TokenService,
    ],
    exports: [
        // services
        UsersService,
        TokenService,
    ],
})
export class UsersModule {}
