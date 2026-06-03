import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProspectDto, CreateProspectNoteDto, UpdateProspectDto } from './dto/prospects.dto';

type ProspectWithNotes = Prisma.ProspectGetPayload<{ include: { notes: true } }>;

@Injectable()
export class ProspectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, role: string) {
    const prospects = await this.prisma.prospect.findMany({
      where: this.scopedWhere(userId, role),
      include: { notes: { orderBy: { createdAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return prospects.map((prospect) => this.toView(prospect));
  }

  async get(id: string, userId: string, role: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, ...this.scopedWhere(userId, role) },
      include: { notes: { orderBy: { createdAt: 'desc' } } },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');
    return this.toView(prospect);
  }

  async create(dto: CreateProspectDto, userId: string, role: string) {
    if (role !== 'AGENT' && role !== 'ADMIN') {
      throw new ForbiddenException('Only agents/admins can create prospects');
    }
    const prospect = await this.prisma.prospect.create({
      data: {
        agentId: userId,
        name: dto.name,
        contact: (dto.contact ?? {}) as Prisma.InputJsonValue,
        stage: dto.stage || 'New',
        score: dto.score,
        nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : undefined,
      },
      include: { notes: { orderBy: { createdAt: 'desc' } } },
    });
    return this.toView(prospect);
  }

  async update(id: string, dto: UpdateProspectDto, userId: string, role: string) {
    await this.ensureVisible(id, userId, role);
    const prospect = await this.prisma.prospect.update({
      where: { id },
      data: {
        name: dto.name,
        contact: dto.contact === undefined ? undefined : (dto.contact as Prisma.InputJsonValue),
        stage: dto.stage,
        score: dto.score,
        nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : undefined,
      },
      include: { notes: { orderBy: { createdAt: 'desc' } } },
    });
    return this.toView(prospect);
  }

  async delete(id: string, userId: string, role: string) {
    await this.ensureVisible(id, userId, role);
    await this.prisma.prospectNote.deleteMany({ where: { prospectId: id } });
    await this.prisma.prospect.delete({ where: { id } });
    return { id, deleted: true };
  }

  async addNote(id: string, dto: CreateProspectNoteDto, userId: string, role: string) {
    await this.ensureVisible(id, userId, role);
    const note = await this.prisma.prospectNote.create({
      data: {
        prospectId: id,
        authorId: userId,
        body: dto.body,
        attachments: dto.attachments === undefined ? undefined : (dto.attachments as Prisma.InputJsonValue),
      },
    });
    return note;
  }

  async deleteNote(prospectId: string, noteId: string, userId: string, role: string) {
    await this.ensureVisible(prospectId, userId, role);
    const result = await this.prisma.prospectNote.deleteMany({ where: { id: noteId, prospectId } });
    if (result.count === 0) throw new NotFoundException('Prospect note not found');
    return { id: noteId, deleted: true };
  }

  private scopedWhere(userId: string, role: string) {
    return role === 'ADMIN' ? {} : { agentId: userId };
  }

  private async ensureVisible(id: string, userId: string, role: string) {
    const prospect = await this.prisma.prospect.findFirst({ where: { id, ...this.scopedWhere(userId, role) } });
    if (!prospect) throw new NotFoundException('Prospect not found');
  }

  private toView(prospect: ProspectWithNotes) {
    const lastContactAt = prospect.notes[0]?.createdAt ?? prospect.updatedAt;
    return {
      ...prospect,
      status: prospect.stage,
      probability: prospect.score ?? 0,
      lastContact: lastContactAt.toISOString(),
      noteCount: prospect.notes.length,
    };
  }
}
