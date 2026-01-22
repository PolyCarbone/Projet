# Guide d'utilisation des avatars

## Emplacement des images

Placez vos images d'avatars dans ce dossier avec les noms suivants :
- `avatar-1.png` (disponible à l'onboarding)
- `avatar-2.png`
- `avatar-3.png`
- `avatar-4.png` (disponible à l'onboarding)
- `avatar-5.png`
- `avatar-6.png` (disponible à l'onboarding)
- `avatar-7.png`
- `avatar-8.png`

## Format recommandé

- Format : PNG avec transparence
- Dimensions : 512x512 pixels (ou ratio 1:1)
- Taille de fichier : < 500 KB par image
- Style : Cohérent entre tous les avatars

## Génération d'images temporaires

En attendant vos vraies images, vous pouvez utiliser des services comme :
- https://avatar.vercel.sh/ (avatars générés)
- https://ui-avatars.com/ (avatars avec initiales)
- https://dicebear.com/ (avatars stylisés)

Exemple de commande pour générer des placeholders (avec curl) :
```bash
curl -o avatar-1.png "https://api.dicebear.com/7.x/avataaars/png?seed=1&size=512"
curl -o avatar-4.png "https://api.dicebear.com/7.x/avataaars/png?seed=4&size=512"
curl -o avatar-6.png "https://api.dicebear.com/7.x/avataaars/png?seed=6&size=512"
```
