; Kill any orphaned Ollama processes before installing. The bundled Ollama
; runner loads lib\ollama\vulkan\vulkan-1.dll; if a process from a previous
; session is still alive (crash, unclean exit, manual installer run while the
; app is open), that DLL stays locked and the installer aborts with
; "Error opening file for writing". /T also takes down its runner children.
!macro NSIS_HOOK_PREINSTALL
  nsExec::Exec 'taskkill /F /IM ollama.exe /T'
!macroend

; Clean up app data (SQLite database, webview cache) on uninstall
!macro NSIS_HOOK_POSTUNINSTALL
  RMDir /r "$APPDATA\com.ingramcrm.app"
  RMDir /r "$LOCALAPPDATA\com.ingramcrm.app"
!macroend
