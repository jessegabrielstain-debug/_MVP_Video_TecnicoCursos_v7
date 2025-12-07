type Project = {
  id: string
  user_id: string
  title: string
  description: string
  status: 'draft' | 'processing' | 'ready' | 'error'
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export const mockProjects = new Map<string, Project>()

export function addProject(project: Project) {
  mockProjects.set(project.id, project)
}

export function getUserProjects(userId: string): Project[] {
  return Array.from(mockProjects.values())
    .filter(p => p.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
