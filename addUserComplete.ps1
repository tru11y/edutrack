# Script pour ajouter l'utilisateur avec gestion des règles

Write-Host "🔐 Gestion des règles Firestore pour ajouter l'utilisateur..." -ForegroundColor Cyan

$projectPath = "C:\Users\PC\OneDrive - Epitech\amy\owge\edutrack"
$originalRules = Join-Path $projectPath "firestore.rules"
$tempRules = Join-Path $projectPath "firestore.rules.temp"
$rulesBackup = Join-Path $projectPath "firestore.rules.backup2"

# 1. Sauvegarder les règles originales
Write-Host "📋 Sauvegarde des règles originales..." -ForegroundColor Yellow
Copy-Item $originalRules $rulesBackup -Force
Write-Host "✅ Règles sauvegardées" -ForegroundColor Green

# 2. Utiliser les règles temporaires
Write-Host "🔓 Déploiement des règles temporaires..." -ForegroundColor Yellow
Copy-Item $tempRules $originalRules -Force

# 3. Déployer les règles
Write-Host "📤 Déploiement de la configuration Firebase..." -ForegroundColor Yellow
Push-Location $projectPath
firebase deploy --only firestore:rules | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du déploiement des règles" -ForegroundColor Red
    Copy-Item $rulesBackup $originalRules -Force
    firebase deploy --only firestore:rules | Out-Null
    Pop-Location
    exit 1
}
Write-Host "✅ Règles temporaires déployées" -ForegroundColor Green

# 4. Attendre un peu
Start-Sleep -Seconds 2

# 5. Exécuter le script d'ajout
Write-Host "👤 Ajout de l'utilisateur à Firestore..." -ForegroundColor Yellow
node addUserToFirestore.mjs
$addStatus = $LASTEXITCODE

# 6. Restaurer les règles originales
Write-Host "🔒 Restauration des règles originales..." -ForegroundColor Yellow
Copy-Item $rulesBackup $originalRules -Force
firebase deploy --only firestore:rules | Out-Null
Write-Host "✅ Règles originales restaurées" -ForegroundColor Green

# 7. Nettoyer
Remove-Item $rulesBackup -Force

Pop-Location

# Résultat final
if ($addStatus -eq 0) {
    Write-Host "`n✅ L'utilisateur a été ajouté avec succès !" -ForegroundColor Green
    Write-Host "Email: solqueflo.balley@gmail.com" -ForegroundColor Cyan
    Write-Host "Mot de passe: 12345678" -ForegroundColor Cyan
    Write-Host "`n🔗 Connectez-vous à: https://edutrak-7a344.web.app" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erreur lors de l'ajout de l'utilisateur" -ForegroundColor Red
}

exit $addStatus
