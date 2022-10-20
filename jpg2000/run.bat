@ECHO OFF
start cmd.exe /C "python -m http.server 2628"
start chrome http://127.0.0.1:2628/daikonTest.html