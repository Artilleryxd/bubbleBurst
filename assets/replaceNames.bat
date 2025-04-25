@echo off
setlocal enabledelayedexpansion

:: Set the directory where the files are located
set "directory=C:\path\to\your\folder"

:: Change to the specified directory
cd /d "%directory%"

:: Loop through each file in the directory
for %%f in (* *) do (
    set "filename=%%f"
    set "newname=!filename: =_!"
    ren "%%f" "!newname!"
)

echo Files renamed successfully!
pause
