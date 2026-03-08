param(
  [string]$OutputRoot = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'release'),
  [switch]$SkipBuild,
  [switch]$SanitizeSecrets
)

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$packageScript = Join-Path $projectRoot 'scripts\package-release.ps1'
$releaseDir = Join-Path $OutputRoot 'commerce-image-studio'
$setupBaseName = if ($SanitizeSecrets) { 'commerce-image-studio-safe-setup' } else { 'commerce-image-studio-setup' }
$setupPath = Join-Path $OutputRoot ($setupBaseName + '.exe')
$tmpDir = Join-Path $projectRoot 'tmp\inno'
$issPath = Join-Path $tmpDir 'commerce-image-studio.iss'
$isccCandidates = @(
  'C:\Users\AEboli\AppData\Local\Programs\Inno Setup 6\ISCC.exe',
  'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
  'C:\Program Files\Inno Setup 6\ISCC.exe'
)
$isccPath = $isccCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $isccPath) {
  throw 'ISCC.exe was not found. Install Inno Setup first.'
}

$packageJson = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json
$appVersion = $packageJson.version
$languagesDir = Join-Path (Split-Path $isccPath -Parent) 'Languages'
$languageLines = @(
  '[Languages]',
  'Name: "english"; MessagesFile: "compiler:Default.isl"'
)

if (Test-Path (Join-Path $languagesDir 'ChineseSimplified.isl')) {
  $languageLines += 'Name: "chinesesimp"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"'
}

& $packageScript -SkipBuild:$SkipBuild -SanitizeSecrets:$SanitizeSecrets
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if (-not (Test-Path $releaseDir)) {
  throw "Release directory was not created: $releaseDir"
}

Copy-Item -LiteralPath (Join-Path $releaseDir '启动网站.bat') -Destination (Join-Path $releaseDir 'start-app.bat') -Force
Copy-Item -LiteralPath (Join-Path $releaseDir '安装到本机.bat') -Destination (Join-Path $releaseDir 'install-local.cmd') -Force
Copy-Item -LiteralPath (Join-Path $releaseDir '查看局域网地址.bat') -Destination (Join-Path $releaseDir 'show-lan-ip.bat') -Force

if (Test-Path $tmpDir) {
  Remove-Item -Path $tmpDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tmpDir | Out-Null

function Escape-InnoString([string]$value) {
  return $value.Replace('\', '\\')
}

$sourceDirEscaped = Escape-InnoString $releaseDir
$outputDirEscaped = Escape-InnoString $OutputRoot
$iss = @"
#define MyAppName "Commerce Image Studio"
#define MyAppVersion "$appVersion"
#define MyAppPublisher "Commerce Image Studio"
#define MyAppExeName "start-app.bat"
#define MySourceDir "$sourceDirEscaped"
#define MyOutputDir "$outputDirEscaped"
#define MyOutputBaseFilename "$setupBaseName"

[Setup]
AppId={{0A6D1A78-6B54-45C8-8FD0-0F61A7AF0A41}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\CommerceImageStudio
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir={#MyOutputDir}
OutputBaseFilename={#MyOutputBaseFilename}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\runtime\node.exe
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UsePreviousAppDir=yes
SetupLogging=yes
ChangesEnvironment=no
CloseApplications=no
CreateUninstallRegKey=no
Uninstallable=no

$($languageLines -join "`r`n")

[Files]
Source: "{#MySourceDir}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent
"@
Set-Content -LiteralPath $issPath -Value $iss -Encoding UTF8

if (Test-Path $setupPath) {
  Remove-Item -Path $setupPath -Force
}

& $isccPath $issPath
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if (-not (Test-Path $setupPath)) {
  throw "Setup EXE was not created: $setupPath"
}

Write-Host "Inno Setup installer created at: $setupPath" -ForegroundColor Green
