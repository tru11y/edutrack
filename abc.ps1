# Définir le chemin racine
$root = "src"

# Créer les dossiers
New-Item -ItemType Directory -Force -Path "$root\design"
New-Item -ItemType Directory -Force -Path "$root\components\ui"
New-Item -ItemType Directory -Force -Path "$root\components\layout"
New-Item -ItemType Directory -Force -Path "$root\i18n"

# Créer les fichiers dans design
New-Item -ItemType File -Force -Path "$root\design\tokens.css"
New-Item -ItemType File -Force -Path "$root\design\base.css"
New-Item -ItemType File -Force -Path "$root\design\components.css"

# Créer les fichiers dans components/ui
New-Item -ItemType File -Force -Path "$root\components\ui\Button.tsx"
New-Item -ItemType File -Force -Path "$root\components\ui\Card.tsx"
New-Item -ItemType File -Force -Path "$root\components\ui\Badge.tsx"
New-Item -ItemType File -Force -Path "$root\components\ui\Input.tsx"
New-Item -ItemType File -Force -Path "$root\components\ui\Table.tsx"

# Créer les fichiers dans components/layout
New-Item -ItemType File -Force -Path "$root\components\layout\Page.tsx"
New-Item -ItemType File -Force -Path "$root\components\layout\PageHeader.tsx"

# Créer les fichiers dans i18n
New-Item -ItemType File -Force -Path "$root\i18n\index.ts"
New-Item -ItemType File -Force -Path "$root\i18n\fr.json"
New-Item -ItemType File -Force -Path "$root\i18n\en.json"

# Créer le fichier main.tsx à la racine
New-Item -ItemType File -Force -Path "$root\main.tsx"