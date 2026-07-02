Remove-Item -Path "c:\laragon\www\nexora\app\Modules\Accounting\Migrations\0001_01_01_000001_create_cuentas_contables_table.php" -ErrorAction SilentlyContinue
Remove-Item -Path "c:\laragon\www\nexora\app\Modules\Accounting\Migrations\0001_01_01_000002_create_asientos_contables_table.php" -ErrorAction SilentlyContinue
Remove-Item -Path "c:\laragon\www\nexora\app\Modules\Accounting\Migrations\0001_01_01_000003_create_asiento_lineas_table.php" -ErrorAction SilentlyContinue
Remove-Item -Path "c:\laragon\www\nexora\app\Modules\Accounting\Migrations\0001_01_01_000004_create_cuentas_por_cobrar_table.php" -ErrorAction SilentlyContinue
Remove-Item -Path "c:\laragon\www\nexora\app\Modules\Accounting\Migrations\0001_01_01_000005_create_cuentas_por_pagar_table.php" -ErrorAction SilentlyContinue
composer test -- --filter ContabilidadServiceTest
