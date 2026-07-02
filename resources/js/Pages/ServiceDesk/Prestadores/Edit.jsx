import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrestadorEditModal from '@/Pages/ServiceDesk/Prestadores/PrestadorEditModal'

/**
 * Página legacy de edición.
 * Ya no se navega desde la UI (se usa el modal inline en Index/Show).
 * Si alguien llega directo, abre el modal inmediatamente.
 */
export default function EditPrestador({ prestador }) {
  useEffect(() => {
    if (!prestador) {
      router.get(route('service-desk.prestadores.index'))
    }
  }, [prestador])

  const handleClose = () => {
    router.get(route('service-desk.prestadores.index'))
  }

  if (!prestador) return null

  return (
    <AuthenticatedLayout>
      <Head title={`Editar ${prestador.nombre_completo}`} />
      <PrestadorEditModal
        open={true}
        onClose={handleClose}
        prestador={prestador}
      />
    </AuthenticatedLayout>
  )
}
