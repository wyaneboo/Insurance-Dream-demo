import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineCaseDto, UpdatePipelineCaseDto } from './dto/pipeline.dto';

type PipelineCaseWithPolicy = Prisma.PipelineCaseGetPayload<{
  include: { policy: { include: { owner: true; agent: true } } };
}>;

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, role: string) {
    const cases = await this.prisma.pipelineCase.findMany({
      where: this.scopedWhere(userId, role),
      include: { policy: { include: { owner: true, agent: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return cases.map((item) => this.toView(item));
  }

  async get(id: string, userId: string, role: string) {
    const item = await this.prisma.pipelineCase.findFirst({
      where: { id, ...this.scopedWhere(userId, role) },
      include: { policy: { include: { owner: true, agent: true } } },
    });
    if (!item) throw new NotFoundException('Pipeline case not found');
    return this.toView(item);
  }

  async create(dto: CreatePipelineCaseDto, userId: string, role: string) {
    if (role !== 'AGENT' && role !== 'ADMIN') {
      throw new ForbiddenException('Only agents/admins can create pipeline cases');
    }
    const item = await this.prisma.pipelineCase.create({
      data: {
        agentId: role === 'ADMIN' ? undefined : userId,
        policyId: dto.policyId,
        applicantName: dto.applicantName,
        planName: dto.planName,
        underwritingStatus: dto.underwritingStatus || 'Submitted',
        remarks: dto.remarks,
        pendingReasons:
          dto.pendingReasons === undefined ? undefined : (dto.pendingReasons as Prisma.InputJsonValue),
        requiredDocs: dto.requiredDocs === undefined ? undefined : (dto.requiredDocs as Prisma.InputJsonValue),
        submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
        estimatedIssueDate: dto.estimatedIssueDate ? new Date(dto.estimatedIssueDate) : undefined,
        expiry: dto.expiry ? new Date(dto.expiry) : undefined,
      },
      include: { policy: { include: { owner: true, agent: true } } },
    });
    return this.toView(item);
  }

  async update(id: string, dto: UpdatePipelineCaseDto, userId: string, role: string) {
    await this.ensureVisible(id, userId, role);
    const item = await this.prisma.pipelineCase.update({
      where: { id },
      data: {
        applicantName: dto.applicantName,
        planName: dto.planName,
        underwritingStatus: dto.underwritingStatus,
        remarks: dto.remarks,
        pendingReasons:
          dto.pendingReasons === undefined ? undefined : (dto.pendingReasons as Prisma.InputJsonValue),
        requiredDocs: dto.requiredDocs === undefined ? undefined : (dto.requiredDocs as Prisma.InputJsonValue),
        submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
        estimatedIssueDate: dto.estimatedIssueDate ? new Date(dto.estimatedIssueDate) : undefined,
        expiry: dto.expiry ? new Date(dto.expiry) : undefined,
        policyId: dto.policyId,
      },
      include: { policy: { include: { owner: true, agent: true } } },
    });
    return this.toView(item);
  }

  async delete(id: string, userId: string, role: string) {
    await this.ensureVisible(id, userId, role);
    await this.prisma.pipelineCase.delete({ where: { id } });
    return { id, deleted: true };
  }

  private scopedWhere(userId: string, role: string): Prisma.PipelineCaseWhereInput {
    if (role === 'ADMIN') return {};
    return {
      OR: [{ agentId: userId }, { policy: { agentId: userId } }],
    };
  }

  private async ensureVisible(id: string, userId: string, role: string) {
    const item = await this.prisma.pipelineCase.findFirst({ where: { id, ...this.scopedWhere(userId, role) } });
    if (!item) throw new NotFoundException('Pipeline case not found');
  }

  private toView(item: PipelineCaseWithPolicy) {
    return {
      ...item,
      applicant: item.applicantName,
      plan: item.planName,
      status: item.underwritingStatus,
      submittedDate: item.submittedAt.toISOString(),
    };
  }
}
