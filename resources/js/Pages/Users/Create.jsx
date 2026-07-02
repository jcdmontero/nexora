import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageHeader } from '@/Components/ui/page-header'
import { UserPlus } from 'lucide-react'
import UserForm from './UserForm'

export default function UsersCreate({ roles, sedes }) {
  return (
    <AuthenticatedLayout>
      <Head title="Nuevo usuario" />
      <PageHeader
        title="Nuevo usuario"
        description="Crea una cuenta de acceso y asígnale un rol."
        icon={UserPlus}
        back={{ href: route('core.users.index'), label: 'Usuarios' }}
      />
      <UserForm mode="create" roles={roles} sedes={sedes} />
    </AuthenticatedLayout>
  )
}
