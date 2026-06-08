import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { resolveFields } from './field-utils';
import { AgentAction, CrudOperation, ToolExecution } from './types';
import {
  actionData,
  iso,
  optionalDate,
  optionalNumber,
  optionalRecord,
  optionalString,
  pickSingleNameMatch,
} from './value-utils';

/** Owns all prospect CRUD, scoping, and the prospect field vocabulary. */
@Injectable()
export class ProspectTool {
  constructor(private readonly prisma: PrismaService) {}

  async run(action: AgentAction, userId: string, role: string): Promise<ToolExecution> {
    const requested = action.useDefaultFields ? undefined : action.fields;
    const fields = this.fieldsFor(requested, action.operation!);
    const result = await this.execute(action, userId, role, requested);
    return { result, fields };
  }

  private async execute(action: AgentAction, userId: string, role: string, requested?: string[]) {
    const data = actionData(action.data, 'prospect');
    const id = action.id || (await this.resolveId(action.lookupName || data.name, userId, role));

    switch (action.operation) {
      case 'list':
        return this.list(userId, role, requested);
      case 'get':
        if (!id) return { error: `Could not find exactly one prospect matching ${String(action.lookupName || data.name || 'that request')}.` };
        return this.get(id, userId, role, requested);
      case 'create':
        return this.create(data, userId, requested);
      case 'update':
        if (!id) return { error: `Could not find exactly one prospect matching ${String(action.lookupName || data.name || 'that request')}.` };
        return this.update(id, data, userId, role, requested);
      case 'delete':
        if (!id) return { error: `Could not find exactly one prospect matching ${String(action.lookupName || data.name || 'that request')}.` };
        return this.remove(id, userId, role);
      default:
        return { error: 'Unsupported prospect operation.' };
    }
  }

  private list(userId: string, role: string, requestedFields?: string[]) {
    const fields = this.fieldsFor(requestedFields, 'list');
    return this.prisma.prospect
      .findMany({
        where: this.scope(userId, role),
        select: this.select(fields),
        orderBy: { updatedAt: 'desc' },
      })
      .then((items) => items.map((item) => this.project(item, fields)));
  }

  private get(id: string, userId: string, role: string, requestedFields?: string[]) {
    const fields = this.fieldsFor(requestedFields, 'get');
    return this.prisma.prospect
      .findFirst({
        where: { id, ...this.scope(userId, role) },
        select: this.select(fields),
      })
      .then((item) => (item ? this.project(item, fields) : { error: 'Prospect not found.' }));
  }

  private async create(data: Record<string, unknown>, userId: string, requestedFields?: string[]) {
    const fields = this.fieldsFor(requestedFields, 'create');
    const contact = optionalRecord(data.contact);
    const created = await this.prisma.prospect.create({
      data: {
        agentId: userId,
        name: String(data.name || ''),
        stage: optionalString(data.stage) || 'New',
        score: optionalNumber(data.score),
        contact: (contact || {}) as Prisma.InputJsonValue,
        nextActionAt: optionalDate(data.nextActionAt),
      },
      select: this.select(fields),
    });
    return this.project(created, fields);
  }

  private async update(id: string, data: Record<string, unknown>, userId: string, role: string, requestedFields?: string[]) {
    await this.ensure(id, userId, role);
    const fields = this.fieldsFor(requestedFields, 'update');
    const contact = optionalRecord(data.contact);
    const updated = await this.prisma.prospect.update({
      where: { id },
      data: {
        name: optionalString(data.name),
        stage: optionalString(data.stage),
        score: optionalNumber(data.score),
        contact: contact === undefined ? undefined : (contact as Prisma.InputJsonValue),
        nextActionAt: optionalDate(data.nextActionAt),
      },
      select: this.select(fields),
    });
    return this.project(updated, fields);
  }

  private async remove(id: string, userId: string, role: string) {
    const existing = await this.ensure(id, userId, role);
    await this.prisma.prospectNote.deleteMany({ where: { prospectId: id } });
    await this.prisma.prospect.delete({ where: { id } });
    return { deleted: true, id, name: existing.name };
  }

  private async resolveId(value: unknown, userId: string, role: string): Promise<string | undefined> {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const candidates = await this.prisma.prospect.findMany({
      where: { ...this.scope(userId, role), name: { contains: value, mode: 'insensitive' } },
      select: { id: true, name: true },
      take: 5,
    });
    return pickSingleNameMatch(candidates, value);
  }

  private async ensure(id: string, userId: string, role: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, ...this.scope(userId, role) },
      select: { id: true, name: true },
    });
    if (!prospect) throw new Error('Prospect not found.');
    return prospect;
  }

  private scope(userId: string, role: string) {
    return role === 'ADMIN' ? {} : { agentId: userId };
  }

  private fieldsFor(requested: unknown, operation: CrudOperation): string[] {
    return resolveFields(requested, normalizeProspectField, () => defaultProspectFields(operation));
  }

  private select(fields: string[]): Record<string, true> {
    const select: Record<string, true> = {};
    for (const field of fields) {
      if (field === 'probability') select.score = true;
      else if (field === 'stage') select.stage = true;
      else if (field === 'email' || field === 'phone') select.contact = true;
      else if (field === 'lastContact') select.updatedAt = true;
      else select[field] = true;
    }
    return select;
  }

  private project(row: Record<string, any>, fields: string[]): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const field of fields) {
      if (field === 'probability') output.probability = row.score ?? 0;
      else if (field === 'email') output.email = row.contact?.email ?? '';
      else if (field === 'phone') output.phone = row.contact?.phone ?? '';
      else if (field === 'lastContact') output.lastContact = iso(row.updatedAt);
      else if (field === 'nextActionAt') output.nextActionAt = iso(row.nextActionAt);
      else output[field] = row[field];
    }
    return output;
  }
}

function normalizeProspectField(field: string): string | undefined {
  const normalized = field.toLowerCase().replace(/[^a-z]/g, '');
  if (['id'].includes(normalized)) return 'id';
  if (['name', 'prospectname'].includes(normalized)) return 'name';
  if (['stage', 'status'].includes(normalized)) return 'stage';
  if (['score', 'probability'].includes(normalized)) return 'probability';
  if (['email'].includes(normalized)) return 'email';
  if (['phone'].includes(normalized)) return 'phone';
  if (['nextaction', 'nextactionat'].includes(normalized)) return 'nextActionAt';
  if (['lastcontact', 'updatedat'].includes(normalized)) return 'lastContact';
  return undefined;
}

function defaultProspectFields(operation: CrudOperation): string[] {
  return operation === 'delete' ? ['id', 'name'] : ['id', 'name', 'stage', 'probability'];
}
