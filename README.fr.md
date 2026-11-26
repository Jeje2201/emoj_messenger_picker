# Messenger Emoji

[Francais](README.fr.md) | [English](README.md)

Extension Chrome Manifest V3 qui remplace les raccourcis pendant la saisie sur **https://www.messenger.com/** uniquement.

## Installation

1. Ouvrir `chrome://extensions` dans Chrome.
2. Activer **Mode developpeur**.
3. Cliquer sur **Charger l'extension non empaquetee**.
4. Selectionner le dossier `extension` de ce projet, pas le dossier parent.
5. Recharger l'onglet Messenger deja ouvert.
6. Epingler l'extension dans le menu des extensions pour acceder aux reglages.

Pas de compilation ni de dependances a installer.

## Apres une mise a jour ou si le remplacement ne fonctionne pas

1. Dans `chrome://extensions`, cliquer sur le bouton **Recharger** de Messenger Emoji.
2. Recharger ensuite l'onglet **https://www.messenger.com/** pour remplacer l'ancien script injecte.
3. Ouvrir les reglages depuis l'icone de l'extension dans Chrome, pas depuis le fichier HTML d'apercu.
4. Verifier que le remplacement automatique est active, puis cliquer sur **Enregistrer**.
5. Taper `:sob:` dans une conversation. Le raccourci doit devenir un emoji sans envoyer le message.

## Raccourcis et reglages

Par defaut : `:cwl:` pour rire aux larmes, `:sob:` pour pleurer, `:heart:` pour un coeur, `:smile:` pour un sourire et `:thumbsup:` pour un pouce leve.

L'interface suit la langue d'affichage de Chrome. Le francais et l'anglais sont disponibles ; l'anglais est utilise si aucune traduction n'est trouvee. Aucun bouton de langue n'est necessaire.

Cliquer sur l'icone de l'extension pour ajouter, modifier ou supprimer les associations **Texte / Emoji**, puis **Enregistrer**. Les emoji peuvent etre colles ou choisis avec le panneau Windows **Win + .**. Le commutateur permet de desactiver le remplacement ; enregistrer aussi ce changement. Les reglages s'appliquent aux onglets Messenger ouverts sans rechargement.

Le bouton **Tout vider** supprime toutes les associations, y compris les emojis importes. Apres confirmation, il conserve le commutateur de remplacement et le catalogue local ; enregistrer pour appliquer le changement. Le bouton de reinitialisation distinct restaure les associations par defaut.

Les raccourcis sont litteraux et sensibles a la casse. Ils sont remplaces des que leur dernier caractere est tape. Preferer une notation telle que `:sob:` pour eviter de remplacer le debut d'un mot plus long. Le collage et les champs de recherche ne sont pas modifies. Aucun message n'est envoye par l'extension.

Dans l'editeur de message, taper `:` affiche les associations configurees commencant par `:` ; continuer a taper filtre les suggestions selon le debut du raccourci. Tant que le bandeau de suggestions est ouvert, appuyer sur Entree insere directement le premier emoji propose au lieu d'envoyer le message (`Shift+Entree` conserve le retour a la ligne), et cliquer sur une suggestion remplace aussi la partie saisie par son emoji. La touche Tab permet egalement de parcourir les suggestions avant de valider avec Entree, et Echap ferme le bandeau. Si le remplacement est desactive, les suggestions le sont aussi.

La page des reglages peut actualiser le catalogue public Unicode Emoji et importer tous les emojis manquants d'un coup. Un raccourci est suggere d'apres le nom anglais Unicode (par exemple `:melting_face:`) ; modifiez-le si besoin puis enregistrez. Un emoji deja associe reste intact, et les conflits de raccourcis sont signales au lieu d'etre ecrases. Le catalogue est actualise automatiquement a l'ouverture des reglages si sa copie locale date de plus de sept jours ; **Actualiser le catalogue** force l'actualisation. La recherche permet de gerer une grande liste importee. Dans Messenger, 40 suggestions au maximum sont affichees a la fois ; continuez a taper le raccourci pour les filtrer.

Les anciennes associations entre parentheses, y compris les associations personnalisees, sont converties en deux-points a la lecture des reglages. Si les deux formes existent deja, l'association avec deux-points est conservee. La conversion est enregistree lorsque les reglages sont sauvegardes ; les nouveaux raccourcis personnalises restent libres.

## Confidentialite

Les associations et la copie locale du catalogue restent dans le stockage local de Chrome. L'extension demande un acces a `unicode.org` uniquement pour telecharger les [donnees publiques Unicode Emoji](https://unicode.org/Public/emoji/latest/emoji-test.txt) ; aucun reglage ni raccourci personnel n'est envoye. Le projet n'a pas de serveur ni de telemetrie, et les scripts de contenu restent limites a Messenger. Les donnees Unicode sont soumises aux [conditions d'utilisation Unicode](https://www.unicode.org/terms_of_use.html). Le script ne lit que le texte situe avant le curseur dans l'editeur actif, au moment de la saisie.

## Verification

Ouvrir `tests/browser.html` dans un navigateur pour les tests du moteur et un editeur de test. Le bouton **Tester les suggestions** verifie leur affichage, leur filtrage, la validation par Entree ou par clic et la desactivation. Les tests du moteur et de l'import du catalogue peuvent aussi etre lances avec Node.js 18 ou plus :

```sh
node --test tests/*.test.cjs
```

Pour verifier dans Messenger : taper `:` puis `c`, appuyer sur Entree (ou choisir une suggestion a la souris) en verifiant que l'emoji est insere sans envoyer le message, puis taper `Bonjour :sob:`. Ajouter une association, enregistrer, la tester sans recharger, puis desactiver et enregistrer. Verifier aussi que le message envoye contient bien l'emoji et que Ctrl+Z reste utilisable. Messenger peut faire evoluer son editeur : une verification dans un compte connecte reste necessaire apres ses mises a jour.

`extension/options.html` peut etre ouvert directement pour un apercu de l'interface. Hors de l'extension installee, il affiche les textes anglais de secours et utilise un stockage distinct ; il ne configure pas l'extension installee.

## Icones

Icones Lucide sous licence ISC, conservee dans `extension/icons/LICENSE`.