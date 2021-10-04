@ECHO OFF
start cmd.exe /C "python -m http.server 2045"
start chrome http://127.0.0.1:2045/finalTest/index.html