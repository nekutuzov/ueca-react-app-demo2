# Deploy script - Copy build files to deployment folder
$deployPath = "..\ueca-react-app-demo2-deploy"

Write-Host "Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to $deployPath..." -ForegroundColor Cyan

# Create deploy directory if it doesn't exist
if (-not (Test-Path $deployPath)) {
    Write-Host "Creating deployment directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $deployPath -Force | Out-Null
} else {
    # Remove old files from deploy directory (except .git)
    Write-Host "Cleaning deployment directory..." -ForegroundColor Yellow
    Get-ChildItem -Path $deployPath -Force | Where-Object { $_.Name -ne ".git" } | ForEach-Object {
        Remove-Item $_.FullName -Force -Recurse
    }
}

# Copy all files from dist to deploy directory
Write-Host "Copying files..." -ForegroundColor Yellow
Get-ChildItem -Path "dist" -Force | Where-Object { $_.Name -ne ".git" } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $deployPath -Recurse -Force
}

# GitHub Pages is a static host with no SPA fallback, so a direct request for /button has no file
# to serve and returns GitHub's own 404 page. Pages does serve 404.html for unmatched paths, and
# the app routes from window.location, so an identical copy makes deep links work.
Write-Host "Writing 404.html for SPA deep links..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $deployPath "index.html") -Destination (Join-Path $deployPath "404.html") -Force

# Ensure git remote is configured
Write-Host "Verifying git configuration..." -ForegroundColor Cyan
Push-Location $deployPath
$hasRemote = git remote | Select-String -Pattern "origin" -Quiet
if (-not $hasRemote) {
    Write-Host "Adding git remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/nekutuzov/ueca-react-app-demo2.git
    Write-Host "Remote added successfully!" -ForegroundColor Green
} else {
    Write-Host "Git remote already configured." -ForegroundColor Green
}
Pop-Location

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Files copied to: $deployPath" -ForegroundColor Green
