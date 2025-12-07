/**
 * Review Workflow
 * Fluxo de trabalho de revisão colaborativa
 */

export interface ReviewRequest {
  id: string;
  projectId: string;
  requesterId: string;
  reviewers: string[];
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';
  createdAt: Date;
  completedAt?: Date;
  comments?: string[];
}

export class ReviewWorkflow {
  private requests: Map<string, ReviewRequest> = new Map();
  
  async createReviewRequest(
    projectId: string,
    requesterId: string,
    reviewers: string[]
  ): Promise<string> {
    const requestId = crypto.randomUUID();
    
    const request: ReviewRequest = {
      id: requestId,
      projectId,
      requesterId,
      reviewers,
      status: 'pending',
      createdAt: new Date(),
      comments: [],
    };
    
    this.requests.set(requestId, request);
    return requestId;
  }
  
  async updateStatus(
    requestId: string,
    status: ReviewRequest['status']
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;
    
    request.status = status;
    if (status === 'approved' || status === 'rejected') {
      request.completedAt = new Date();
    }
    return true;
  }
  
  async getRequest(requestId: string): Promise<ReviewRequest | null> {
    return this.requests.get(requestId) || null;
  }
  
  async listForReviewer(reviewerId: string): Promise<ReviewRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.reviewers.includes(reviewerId));
  }

  async publishProject(params: { projectId: string; userId: string }): Promise<{ success: boolean; error?: string }> {
    // Placeholder - implementar integração com sistema de publicação
    console.log(`Publishing project ${params.projectId} by user ${params.userId}`);
    return { success: true };
  }

  async reopenForEditing(params: { projectId: string; userId: string; reason?: string }): Promise<{ success: boolean; error?: string }> {
    // Find review by projectId
    const request = Array.from(this.requests.values()).find(r => r.projectId === params.projectId);
    if (!request) return { success: false, error: 'Review not found' };
    
    request.status = 'pending';
    request.completedAt = undefined;
    return { success: true };
  }

  async submitReview(params: { reviewId: string; userId: string; decision: 'approved' | 'rejected' | 'changes_requested'; comments?: string }): Promise<{ success: boolean; error?: string }> {
    const request = this.requests.get(params.reviewId);
    if (!request) return { success: false, error: 'Review not found' };
    
    request.status = params.decision;
    request.completedAt = new Date();
    if (params.comments) {
      request.comments = request.comments || [];
      request.comments.push(params.comments);
    }
    return { success: true };
  }

  async getReviewStats(params: { userId: string; organizationId?: string; startDate?: Date; endDate?: Date }): Promise<{ pending: number; approved: number; rejected: number }> {
    const requests = Array.from(this.requests.values()).filter(r => r.reviewers.includes(params.userId));
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  }

  async getReviewStatus(reviewId: string): Promise<ReviewRequest | null> {
    return this.requests.get(reviewId) || null;
  }
}

export const reviewWorkflowService = new ReviewWorkflow();
