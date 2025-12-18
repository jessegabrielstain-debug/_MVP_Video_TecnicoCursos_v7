import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface Comment {
  id: string;
  userId: string;
  projectId: string;
  slideId?: string;
  timestamp?: number; // timestamp no vídeo/slide
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  resolved?: boolean;
  replies?: Comment[];
  reactions?: { userId: string; emoji: string }[];
  resolutionNote?: string;
  position?: Record<string, unknown>;
  parentId?: string | null;
  user?: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export interface CreateCommentInput {
  userId: string;
  projectId: string;
  slideId?: string;
  timestamp?: number;
  content: string;
  resolutionNote?: string;
  position?: Record<string, unknown>;
  parentId?: string;
}

export class CommentsService {
  
  async create(input: CreateCommentInput): Promise<Comment> {
    const { userId, projectId, content, position, parentId } = input;
    
    const comment = await prisma.projectComment.create({
      data: {
        userId,
        projectId,
        content,
        position: position ? JSON.stringify(position) : Prisma.JsonNull,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return this.mapPrismaComment(comment);
  }
  
  async get(commentId: string): Promise<Comment | null> {
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
    
    return comment ? this.mapPrismaComment(comment) : null;
  }
  
  async list(filters: Partial<Pick<Comment, 'projectId' | 'slideId' | 'userId'>>): Promise<Comment[]> {
    const where: Prisma.ProjectCommentWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.userId = filters.userId;
    // slideId is not directly in schema, maybe stored in position or content? 
    // For now ignoring slideId filter if not in schema, or assuming it's part of position logic which is complex to query.
    
    const comments = await prisma.projectComment.findMany({
      where: {
        ...where,
        parentId: null // Only fetch root comments
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return comments.map(c => this.mapPrismaComment(c));
  }
  
  async update(commentId: string, updates: Partial<Comment>): Promise<Comment | null> {
    try {
      const comment = await prisma.projectComment.update({
        where: { id: commentId },
        data: {
          content: updates.content,
          resolved: updates.resolved,
          // position: updates.position ? JSON.stringify(updates.position) : undefined
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      });
      return this.mapPrismaComment(comment);
    } catch (e) {
      return null;
    }
  }
  
  async delete(commentId: string): Promise<boolean> {
    try {
      await prisma.projectComment.delete({
        where: { id: commentId }
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  
  async resolve(commentId: string): Promise<boolean> {
    try {
      await prisma.projectComment.update({
        where: { id: commentId },
        data: { resolved: true }
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  
  async resolveComment(input: { commentId: string; userId: string; resolutionNote?: string }): Promise<boolean> {
    // Note: resolutionNote is not in schema yet, ignoring for now or storing in content?
    // Assuming just resolving boolean for now.
    return this.resolve(input.commentId);
  }
  
  async reopenComment(input: { commentId: string; userId: string }): Promise<boolean> {
    try {
      await prisma.projectComment.update({
        where: { id: input.commentId },
        data: { resolved: false }
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  
  async addReaction(input: { commentId: string; userId: string; emoji: string }): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // Verificar se a reação já existe
      const existingReaction = await prisma.commentReaction.findUnique({
        where: {
          commentId_userId_emoji: {
            commentId: input.commentId,
            userId: input.userId,
            emoji: input.emoji
          }
        }
      });

      if (existingReaction) {
        // Remover reação se já existe (toggle)
        await prisma.commentReaction.delete({
          where: {
            id: existingReaction.id
          }
        });
        return false; // Reação removida
      } else {
        // Adicionar nova reação
        await prisma.commentReaction.create({
          data: {
            commentId: input.commentId,
            userId: input.userId,
            emoji: input.emoji
          }
        });
        return true; // Reação adicionada
      }
    } catch (error) {
      logger.error('Erro ao adicionar reação', error instanceof Error ? error : new Error(String(error)), {
        component: 'CommentsService',
        commentId: input.commentId,
        userId: input.userId
      });
      throw error;
    }
  }

  async replyToComment(input: { commentId: string; userId: string; content: string }): Promise<Comment | null> {
    const parent = await prisma.projectComment.findUnique({ where: { id: input.commentId } });
    if (!parent) return null;

    const reply = await prisma.projectComment.create({
      data: {
        projectId: parent.projectId,
        userId: input.userId,
        content: input.content,
        parentId: input.commentId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    return this.mapPrismaComment(reply);
  }

  async searchUsersForMention(options: { projectId: string; query: string; limit: number }): Promise<{ id: string; name: string; avatar?: string }[]> {
    const { query, limit } = options;
    
    const users = await prisma.user.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      take: limit,
      select: {
        id: true,
        name: true,
        avatarUrl: true
      }
    });
    
    return users.map(u => ({
      id: u.id,
      name: u.name || 'Unknown',
      avatar: u.avatarUrl || undefined
    }));
  }

  async getCommentStats(projectId: string): Promise<{ total: number; resolved: number; open: number }> {
    const total = await prisma.projectComment.count({ where: { projectId } });
    const resolved = await prisma.projectComment.count({ where: { projectId, resolved: true } });
    
    return {
      total,
      resolved,
      open: total - resolved
    };
  }

  async deleteComment(input: { commentId: string; userId: string }): Promise<boolean> {
    const comment = await prisma.projectComment.findUnique({ where: { id: input.commentId } });
    if (!comment) return false;
    if (comment.userId !== input.userId) return false; 
    
    return this.delete(input.commentId);
  }

  private mapPrismaComment(c: Record<string, unknown>): Comment {
    return {
      id: c.id as string,
      userId: c.userId as string,
      projectId: c.projectId as string,
      content: c.content as string,
      createdAt: c.createdAt as Date,
      updatedAt: c.updatedAt as Date | undefined,
      resolved: c.resolved as boolean | undefined,
      parentId: c.parentId as string | null | undefined,
      position: c.position ? JSON.parse(JSON.stringify(c.position)) : undefined,
      user: c.user ? {
        name: (c.user as Record<string, unknown>).name as string | null,
        email: (c.user as Record<string, unknown>).email as string | null,
        image: (c.user as Record<string, unknown>).avatarUrl as string | null
      } : undefined,
      replies: c.replies ? (c.replies as Record<string, unknown>[]).map((r) => this.mapPrismaComment(r)) : []
    };
  }
}

export const commentsService = new CommentsService();
