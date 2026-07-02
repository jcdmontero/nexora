import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageHeader } from '@/Components/ui/page-header'
import { UserCog } from 'lucide-react'
import UserForm from './UserForm'

export default function UsersEdit({ user, roles, sedes }) {
  return (
    <AuthenticatedLayout>
      <Head title={`Editar ${user.name}`} />
      <PageHeader
        title="Editar usuario"
        description={`Actualiza la información de ${user.name}.`}
        icon={UserCog}
        back={{ href: route('core.users.index'), label: 'Usuarios' }}
      />
      <UserForm mode="edit" user={user} roles={roles} sedes={sedes} />
    </AuthenticatedLayout>
  )
}
