import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { AiModule } from './modules/ai/ai.module';
import { FilesModule } from './modules/files/files.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PoliciesModule,
    AiModule,
    FilesModule,
    TasksModule,
    HealthModule,
  ],
})
export class AppModule {}
