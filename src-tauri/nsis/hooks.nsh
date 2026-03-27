; Clean up app data (SQLite database, webview cache) on uninstall
!macro NSIS_HOOK_POSTUNINSTALL
  RMDir /r "$APPDATA\com.ingramcrm.app"
  RMDir /r "$LOCALAPPDATA\com.ingramcrm.app"
!macroend
