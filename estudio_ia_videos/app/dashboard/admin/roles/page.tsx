'use client'

import { useState, useEffect } from 'react'
import { AdminGate } from '@/lib/components/rbac'
import { LoadingState } from '@/components/ui/feedback'
import { ErrorState } from '@/components/ui/feedback'
import { SuccessInline } from '@/components/ui/feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, UserPlus, Edit2, Trash2, Save } from 'lucide-react'

interface Role {
  id: string
  name: string
  description?: string
  permissions?: string[]
}

interface User {
  id: string
  email?: string
  name?: string
  roles: string[]
}

function RolesContent() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/users')
      ])

      if (!rolesRes.ok) throw new Error('Falha ao carregar roles')
      if (!usersRes.ok) throw new Error('Falha ao carregar usuários')

      const rolesData = await rolesRes.json()
      const usersData = await usersRes.json()

      setRoles(rolesData.roles || [])
      setUsers(usersData.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function assignRole(userId: string, role: string) {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (!res.ok) throw new Error('Falha ao atribuir role')

      setSuccess(`Role "${role}" atribuída com sucesso!`)
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir role')
    }
  }

  async function removeRole(userId: string, role: string) {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles/${role}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Falha ao remover role')

      setSuccess(`Role "${role}" removida com sucesso!`)
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover role')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState label="Carregando gerenciamento de roles..." />
      </div>
    )
  }

  if (error && !roles.length) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState
          title="Erro ao carregar dados"
          message={error}
          onRetry={loadData}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gerenciamento de Roles
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure papéis e permissões de usuários
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <ErrorState
          title="Erro"
          message={error}
        />
      )}
      {success && (
        <SuccessInline message={success} />
      )}

      {/* Roles Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Disponíveis</CardTitle>
          <CardDescription>
            Papéis definidos no sistema e suas descrições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="border rounded-lg p-4 space-y-2 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="text-sm">
                    {role.name}
                  </Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                )}
                {role.permissions && role.permissions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Permissões:</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users and Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Atribuição de Roles</CardTitle>
          <CardDescription>
            Gerencie os papéis dos usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{user.name || user.email || user.id}</p>
                    {user.email && user.name && (
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
                  </div>
                </div>

                {/* Current Roles */}
                <div>
                  <p className="text-sm font-medium mb-2">Roles atuais:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant="default" className="gap-1">
                          {role}
                          <button
                            onClick={() => removeRole(user.id, role)}
                            className="ml-1 hover:text-destructive"
                            aria-label={`Remover role ${role}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma role atribuída</p>
                    )}
                  </div>
                </div>

                {/* Add Role Selector */}
                <div>
                  <p className="text-sm font-medium mb-2">Adicionar role:</p>
                  <div className="flex flex-wrap gap-2">
                    {roles
                      .filter((role) => !user.roles.includes(role.name))
                      .map((role) => (
                        <Button
                          key={role.id}
                          variant="outline"
                          size="sm"
                          onClick={() => assignRole(user.id, role.name)}
                          className="gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          {role.name}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário cadastrado no sistema
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RolesAdminPage() {
  return (
    <AdminGate
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Esta página é restrita a administradores do sistema.
          </p>
        </div>
      }
      loading={<LoadingState label="Verificando permissões..." />}
    >
      <RolesContent />
    </AdminGate>
  )
}
