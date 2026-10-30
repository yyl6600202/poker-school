# 一键把德扑教室推到你的 GitHub 仓库
# 用法（在 poker-school 目录下）：
#   powershell -ExecutionPolicy Bypass -File .\publish.ps1 https://github.com/你的账号/poker-school.git
#
# 做三件事：配好 origin、推 main 分支、打印下一步（开 GitHub Pages）。

param(
  [Parameter(Position = 0)]
  [string]$RepoUrl
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not $RepoUrl) {
  Write-Host "用法: powershell -ExecutionPolicy Bypass -File .\publish.ps1 <仓库地址>" -ForegroundColor Yellow
  Write-Host "例如: .\publish.ps1 https://github.com/myname/poker-school.git" -ForegroundColor Yellow
  exit 1
}

if ($RepoUrl -notmatch '^https://github\.com/.+/.+\.git$') {
  Write-Host "地址看起来不对，应该是 https://github.com/<账号>/<仓库名>.git" -ForegroundColor Red
  Write-Host "你给的是: $RepoUrl" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path ".git")) {
  Write-Host "当前目录不是 Git 仓库（找不到 .git）" -ForegroundColor Red
  exit 1
}

# 1) 配置远端（已存在则覆盖，避免重复 add 报错）
$existing = git remote 2>$null
if ($existing -contains "origin") {
  git remote set-url origin $RepoUrl
  Write-Host "已更新 origin -> $RepoUrl"
} else {
  git remote add origin $RepoUrl
  Write-Host "已添加 origin -> $RepoUrl"
}

# 2) 推送
Write-Host "`n正在推送…（如果弹窗要求登录，按提示授权即可）`n" -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -ne 0) {
  Write-Host "`n推送失败。常见原因：" -ForegroundColor Red
  Write-Host "  · 网页上的仓库还没建（或名字拼错）"
  Write-Host "  · 仓库是私有的，而免费版 Pages 只支持公开仓库"
  Write-Host "  · 需要登录 GitHub（用弹出的窗口或 Personal Access Token）"
  exit 1
}

# 3) 下一步提示
$web = $RepoUrl -replace '\.git$', ''
Write-Host "`n✅ 推送完成。`n" -ForegroundColor Green
Write-Host "接下来开 GitHub Pages（浏览器里操作，约 30 秒）：" -ForegroundColor Cyan
Write-Host "  1. 打开 $web/settings/pages"
Write-Host "  2. Source 选 'Deploy from a branch'"
Write-Host "  3. Branch 选 'main'，目录选 '/ (root)'，点 Save"
Write-Host "  4. 等 1 分钟后访问：$web 对应的 Pages 地址（页面会显示）"
Write-Host ""
Write-Host "也可以直接把 poker-school-single.html 发给别人看，不用等 Pages。" -ForegroundColor DarkGray
