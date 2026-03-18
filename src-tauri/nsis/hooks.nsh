; Clean up app data (SQLite database, settings) on uninstall
!macro NSIS_HOOK_POSTUNINSTALL
  RMDir /r "$APPDATA\com.ingramcrm.app"
!macroend
