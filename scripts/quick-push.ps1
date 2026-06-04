# 한 번에 add + commit + push 하는 도우미 스크립트
# 사용 예:
#   powershell -ExecutionPolicy Bypass -File scripts/quick-push.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/quick-push.ps1 -Message "버튼 추가"
param(
  [string]$Message
)

# 저장소 루트로 이동 (이 스크립트는 scripts/ 안에 있음)
Set-Location (Split-Path $PSScriptRoot -Parent)

git add -A

# 스테이징된 변경이 없으면 종료 (--quiet: 변경 있으면 exit 1, 없으면 exit 0)
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "커밋할 변경사항이 없습니다." -ForegroundColor Yellow
  exit 0
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "update " + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Host "커밋 실패. 위 메시지를 확인하세요." -ForegroundColor Red
  exit $LASTEXITCODE
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
git push origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "푸시 실패. 네트워크·인증을 확인하세요." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "푸시 완료 → origin/$branch  ($Message)" -ForegroundColor Green
