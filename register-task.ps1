$exe  = 'powershell.exe'
$arg  = '-ExecutionPolicy Bypass -WindowStyle Hidden -NonInteractive -File "C:\Users\bawas\.local\bin\itmanager\start-server.ps1"'

$action   = New-ScheduledTaskAction -Execute $exe -Argument $arg
$trigger  = New-ScheduledTaskTrigger -AtLogOn -User 'bawas'
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName 'ITManager Server' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host 'Task registered OK'
Get-ScheduledTask -TaskName 'ITManager Server' | Select-Object TaskName, State
