Get-ChildItem " C:\laragon\www\nexora\public\build\assets\ -File | Sort-Object Length -Descending | Select-Object -First 20 | Format-Table Name, Length -AutoSize
