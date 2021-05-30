; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "Obyte-TN"
#define MyAppPackageName "Obyte-TN"
#define MyAppVersion "3.4.0"
#define MyAppPublisher "Obyte"
#define MyAppURL "https://obyte.org"
#define MyAppExeName "Obyte-TN.exe"

[Setup]
; AppId={{804636ee-b017-4cad-8719-e58ac97ffa5c}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputBaseFilename={#MyAppPackageName}-win32
; SourceDir=../../obytebuilds
OutputDir=../../obytebuilds
Compression=lzma
SolidCompression=yes
; SetupIconFile=../public/img/icons/logo-circle.ico
UninstallDisplayIcon={app}/icon.ico
ChangesAssociations=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
; Name: "french"; MessagesFile: "compiler:Languages\French.isl"
; Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"
; Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Registry]
Root: HKLM; Subkey: "Software\Classes\byteball-tn"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Classes\byteball-tn"; ValueType: string; ValueName: ""; ValueData: "URL:Byteball Protocol"
Root: HKLM; Subkey: "Software\Classes\byteball-tn"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKLM; Subkey: "Software\Classes\byteball-tn\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icon.ico"
Root: HKLM; Subkey: "Software\Classes\byteball-tn\shell"
Root: HKLM; Subkey: "Software\Classes\byteball-tn\shell\open"
Root: HKLM; Subkey: "Software\Classes\byteball-tn\shell\open\command"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName} ""%1"""

Root: HKLM; Subkey: "Software\Classes\obyte-tn"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Classes\obyte-tn"; ValueType: string; ValueName: ""; ValueData: "URL:Obyte Protocol"
Root: HKLM; Subkey: "Software\Classes\obyte-tn"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKLM; Subkey: "Software\Classes\obyte-tn\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icon.ico"
Root: HKLM; Subkey: "Software\Classes\obyte-tn\shell"
Root: HKLM; Subkey: "Software\Classes\obyte-tn\shell\open"
Root: HKLM; Subkey: "Software\Classes\obyte-tn\shell\open\command"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName} ""%1"""

Root: HKCR; Subkey: ".coin-tn";                             ValueData: "{#MyAppName}Coin-TN";          Flags: uninsdeletevalue; ValueType: string;  ValueName: ""
Root: HKCR; Subkey: "{#MyAppName}Coin-TN";                     ValueData: "{#MyAppName} Private Coin For Testnet";  Flags: uninsdeletekey;   ValueType: string;  ValueName: ""
Root: HKCR; Subkey: "{#MyAppName}Coin-TN\DefaultIcon";             ValueData: "{app}\icon.ico";               ValueType: string;  ValueName: ""
Root: HKCR; Subkey: "{#MyAppName}Coin-TN\shell\open\command";  ValueData: "{app}\{#MyAppExeName} ""%1""";  ValueType: string;  ValueName: ""

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "..\..\obytebuilds\{#MyAppPackageName}\win32\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "../public/img/icons/logo-circle.ico"; DestDir: "{app}"; DestName: "icon.ico"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}/icon.ico"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}/icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

