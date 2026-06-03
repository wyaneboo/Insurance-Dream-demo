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
import { ClaimsModule } from './modules/claims/claims.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { VaultModule } from './modules/vault/vault.module';
import { ContentModule } from './modules/content/content.module';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './modules/shared/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'], load: [configuration], validate: validateEnv }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PoliciesModule,
    AiModule,
    FilesModule,
    TasksModule,
    HealthModule,
    ClaimsModule,
    ServicesModule,
    AppointmentsModule,
    NotificationsModule,
    RewardsModule,
    VaultModule,
    ContentModule,
    ProspectsModule,
    PipelineModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
