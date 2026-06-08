import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { resolveFields } from './field-utils';
import { AgentAction, CrudOperation, ToolExecution } from './types';
import {
  actionData,
  iso,
  optionalDate,
  optionalString,
  optionalStringArray,
  pickSingleNameMatch,
} from './value-utils';

/** Owns all submission-pipeline CRUD, scoping, and the pipeline field vocabulary. */
@Injectable()
export class PipelineTool {
  constructor(private readonly prisma: PrismaService) {}

  async run(action: AgentAction, userId: string, role: string): Promise<ToolExecution> {
    const requested = action.useDefaultFields ? undefined : action.fields;
    const fields = this.fieldsFor(requested, action.operation!);
    const result = await this.execute(action, userId, role, requested);
    return { result, fields };
  }

  private async execute(action: AgentAction, userId: string, role: string, requested?: string[]) {
    const data = actionData(action.data, 'pipeline');
    const id = action.id || (await this.resolveId(action.lookupName || data.applicantName || data.applicant, userId, role));

    switch (action.operation) {
      case 'list':
        return this.list(userId, role, requested);
      case 'get':
        if (!id) return { error: `Could not find exactly one submission case matching ${String(action.lookupName || data.applicantName || data.applicant || 'that request')}.` };
        return this.get(id, userId, role, requested);
      case 'create':
        return this.create(data, userId, requested);
      case 'update':
        if (!id) return { error: `Could not find exactly one submission case matching ${String(action.lookupName || data.applicantName || data.applicant || 'that request')}.` };
        return this.update(id, data, userId, role, requested);
      case 'delete':
        if (!id) return { error: `Could not find exactly one submission case matching ${String(action.lookupName || data.applicantName || data.applicant || 'that request')}.` };
        return this.remove(id, userId, role);
      default:
        return { error: 'Unsupported pipeline operation.' };
    }
  }

  private list(userId: string, role: string, requestedFields?: string[]) {
    const fields = this.fieldsFor(requestedFields, 'list');
    return this.prisma.pipelineCase
      .findMany({
        where: this.scope(userId, role),
        select: this.select(fields),
        orderBy: { updatedAt: 'desc' },
      })
      .then((items) => items.map((item) => this.project(item, fields)));
  }

  private get(id: string, userId: string, role: string, requestedFields?: string[]) {
    const fields = this.fieldsFor(requestedFields, 'get');
    return this.prisma.pipelineCase
      .findFirst({
        where: { id, ...this.scope(userId, role) },
        select: this.select(fields),
      })
      .then((item) => (item ? this.project(item, fields) : { error: 'Submission case not found.' }));
  }

  private async create(data: Record<string, unknown>, userId: string, requestedFields?: string[]) {
    const fields = this.fieldsFor(requestedFields, 'create');
    const created = await this.prisma.pipelineCase.create({
      data: {
        agentId: userId,
        applicantName: String(data.applicantName || data.applicant || ''),
        planName: String(data.planName || data.plan || ''),
        underwritingStatus: optionalString(data.underwritingStatus || data.status) || 'Submitted',
        remarks: optionalString(data.remarks),
        pendingReasons: optionalStringArray(data.pendingReasons),
        requiredDocs: optionalStringArray(data.requiredDocs),
        submittedAt: optionalDate(data.submittedAt || data.submittedDate),
        estimatedIssueDate: optionalDate(data.estimatedIssueDate),
        expiry: optionalDate(data.expiry),
      },
      select: this.select(fields),
    });
    return this.project(created, fields);
  }

  private async update(id: string, data: Record<string, unknown>, userId: string, role: string, requestedFields?: string[]) {
    await this.ensure(id, userId, role);
    const fields = this.fieldsFor(requestedFields, 'update');
    const updated = await this.prisma.pipelineCase.update({
      where: { id },
      data: {
        applicantName: optionalString(data.applicantName || data.applicant),
        planName: optionalString(data.planName || data.plan),
        underwritingStatus: optionalString(data.underwritingStatus || data.status),
        remarks: optionalString(data.remarks),
        pendingReasons: optionalStringArray(data.pendingReasons),
        requiredDocs: optionalStringArray(data.requiredDocs),
        submittedAt: optionalDate(data.submittedAt || data.submittedDate),
        estimatedIssueDate: optionalDate(data.estimatedIssueDate),
        expiry: optionalDate(data.expiry),
      },
      select: this.select(fields),
    });
    return this.project(updated, fields);
  }

  private async remove(id: string, userId: string, role: string) {
    const existing = await this.ensure(id, userId, role);
    await this.prisma.pipelineCase.delete({ where: { id } });
    return { deleted: true, id, applicant: existing.applicantName };
  }

  private async resolveId(value: unknown, userId: string, role: string): Promise<string | undefined> {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const candidates = await this.prisma.pipelineCase.findMany({
      where: { ...this.scope(userId, role), applicantName: { contains: value, mode: 'insensitive' } },
      select: { id: true, applicantName: true },
      take: 5,
    });
    return pickSingleNameMatch(candidates.map((item) => ({ id: item.id, name: item.applicantName })), value);
  }

  private async ensure(id: string, userId: string, role: string) {
    const item = await this.prisma.pipelineCase.findFirst({
      where: { id, ...this.scope(userId, role) },
      select: { id: true, applicantName: true },
    });
    if (!item) throw new Error('Submission case not found.');
    return item;
  }

  private scope(userId: string, role: string) {
    return role === 'ADMIN' ? {} : { OR: [{ agentId: userId }, { policy: { agentId: userId } }] };
  }

  private fieldsFor(requested: unknown, operation: CrudOperation): string[] {
    return resolveFields(requested, normalizePipelineField, () => defaultPipelineFields(operation));
  }

  private select(fields: string[]): Record<string, true> {
    const select: Record<string, true> = {};
    for (const field of fields) {
      if (field === 'applicant') select.applicantName = true;
      else if (field === 'plan') select.planName = true;
      else if (field === 'status') select.underwritingStatus = true;
      else if (field === 'submittedDate') select.submittedAt = true;
      else select[field] = true;
    }
    return select;
  }

  private project(row: Record<string, any>, fields: string[]): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const field of fields) {
      if (field === 'applicant') output.applicant = row.applicantName;
      else if (field === 'plan') output.plan = row.planName;
      else if (field === 'status') output.status = row.underwritingStatus;
      else if (field === 'submittedDate') output.submittedDate = iso(row.submittedAt);
      else output[field] = row[field];
    }
    return output;
  }
}

function normalizePipelineField(field: string): string | undefined {
  const normalized = field.toLowerCase().replace(/[^a-z]/g, '');
  if (['id'].includes(normalized)) return 'id';
  if (['applicant', 'applicantname', 'name'].includes(normalized)) return 'applicant';
  if (['plan', 'planname'].includes(normalized)) return 'plan';
  if (['status', 'underwritingstatus'].includes(normalized)) return 'status';
  if (['submitted', 'submittedat', 'submitteddate'].includes(normalized)) return 'submittedDate';
  if (['remarks', 'remark'].includes(normalized)) return 'remarks';
  if (['pendingreasons', 'pendingreason'].includes(normalized)) return 'pendingReasons';
  if (['requireddocs', 'requireddocuments'].includes(normalized)) return 'requiredDocs';
  return undefined;
}

function defaultPipelineFields(operation: CrudOperation): string[] {
  return operation === 'delete' ? ['id', 'applicant'] : ['id', 'applicant', 'plan', 'status'];
}
