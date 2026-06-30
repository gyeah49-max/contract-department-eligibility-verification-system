@echo off
powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c start /B npm run dev' -WorkingDirectory '%CD%' -WindowStyle Hidden"
echo Server started on http://localhost:3000 (background process)
