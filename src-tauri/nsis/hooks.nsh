; Refresh Start Menu shortcut on every install/update so it always
; points to the current binary, not a stale older installation.
!macro NSIS_HOOK_POSTINSTALL
  Delete "$SMPROGRAMS\Ingram Micro CRM.lnk"
  CreateShortCut "$SMPROGRAMS\Ingram Micro CRM.lnk" "$INSTDIR\Ingram Micro CRM.exe"
!macroend

; Clean up shortcuts and app data on uninstall
!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$SMPROGRAMS\Ingram Micro CRM.lnk"
  RMDir /r "$LOCALAPPDATA\com.ingramcrm.app"
!macroend
