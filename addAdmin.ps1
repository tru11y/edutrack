# Script pour ajouter un admin à Firestore avec gestion des règles

Write-Host "🔐 Gestion des règles Firestore pour ajouter l'admin..." -ForegroundColor Cyan

$projectPath = "C:\Users\PC\OneDrive - Epitech\amy\owge\edutrack"
$originalRules = Join-Path $projectPath "firestore.rules"
$tempRules = Join-Path $projectPath "firestore.rules.temp"
$rulesBackup = Join-Path $projectPath "firestore.rules.backup"

# 1. Sauvegarder les règles originales
Write-Host "📋 Sauvegarde des règles originales..." -ForegroundColor Yellow
Copy-Item $originalRules $rulesBackup -Force
Write-Host "✅ Règles sauvegardées dans: $rulesBackup" -ForegroundColor Green

# 2. Utiliser les règles temporaires
Write-Host "🔓 Déploiement des règles temporaires..." -ForegroundColor Yellow
Copy-Item $tempRules $originalRules -Force

# 3. Déployer les règles
Write-Host "📤 Déploiement de la configuration Firebase..." -ForegroundColor Yellow
Push-Location $projectPath
firebase deploy --only firestore:rules | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du déploiement des règles" -ForegroundColor Red
    # Restaurer les règles originales
    Copy-Item $rulesBackup $originalRules -Force
    firebase deploy --only firestore:rules | Out-Null
    Pop-Location
    exit 1
}
Write-Host "✅ Règles temporaires déployées" -ForegroundColor Green

# 4. Attendre un peu pour que les règles soient appliquées
Start-Sleep -Seconds 2

# 5. Exécuter le script d'ajout d'admin
Write-Host "👤 Ajout de l'administrateur..." -ForegroundColor Yellow
node addAdmin.mjs
$adminAddStatus = $LASTEXITCODE

# 6. Restaurer les règles originales
Write-Host "🔒 Restauration des règles originales..." -ForegroundColor Yellow
Copy-Item $rulesBackup $originalRules -Force
firebase deploy --only firestore:rules | Out-Null
Write-Host "✅ Règles originales restaurées" -ForegroundColor Green

# 7. Nettoyer les fichiers temporaires
Remove-Item $rulesBackup -Force
Remove-Item $tempRules -Force

Pop-Location

# Afficher le résultat final
if ($adminAddStatus -eq 0) {
    Write-Host "`n✅ L'administrateur a été ajouté avec succès !" -ForegroundColor Green
    Write-Host "Email: admin@edutrack.com" -ForegroundColor Cyan
    Write-Host "UID: admin_001" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Erreur lors de l'ajout de l'administrateur" -ForegroundColor Red
}

exit $adminAddStatus
