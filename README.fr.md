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

Cliquer sur l'icone de l'extension pour ajouter, modifier ou supprimer les associations **Texte / Emoji**, puis **Enregistrer**. Les emoji peuvent etre colles ou choisis avec le panneau Windows **Win + .**. Le commutateur permet de desactiver le remplacement ; enregistrer aussi ce changement. Les reglages s'appliquent aux onglets Messenger ouverts sans rechargement.

Les raccourcis sont litteraux et sensibles a la casse. Ils sont remplaces des que leur dernier caractere est tape. Preferer une notation telle que `:sob:` pour eviter de remplacer le debut d'un mot plus long. Le collage et les champs de recherche ne sont pas modifies. Aucun message n'est envoye par l'extension.

Dans l'editeur de message, taper `:` affiche les associations configurees commencant par `:` ; continuer a taper filtre les suggestions selon le debut du raccourci. Cliquer sur une suggestion remplace la partie saisie par son emoji. La touche Tab permet aussi de parcourir les suggestions et Entree de choisir ; Echap ferme le bandeau. Si le remplacement est desactive, les suggestions le sont aussi.

Les anciennes associations entre parentheses, y compris les associations personnalisees, sont converties en deux-points a la lecture des reglages. Si les deux formes existent deja, l'association avec deux-points est conservee. La conversion est enregistree lorsque les reglages sont sauvegardes ; les nouveaux raccourcis personnalises restent libres.

## Confidentialite

Seule permission supplementaire : `storage`. Les associations restent dans le stockage local de Chrome. Aucun serveur, aucune telemetrie, aucun acces aux autres sites. Le script ne lit que le texte situe avant le curseur dans l'editeur actif, au moment de la saisie.

## Verification

Ouvrir `tests/browser.html` dans un navigateur pour les tests du moteur et un editeur de test. Le bouton **Tester les suggestions** verifie leur affichage, leur filtrage, l'insertion et la desactivation. Les tests du moteur peuvent aussi etre lances avec Node.js 18 ou plus :

```sh
node --test tests/rules.test.cjs
```

Pour verifier dans Messenger : taper `:` puis `c`, choisir une suggestion a la souris, puis taper `Bonjour :sob:`. Ajouter une association, enregistrer, la tester sans recharger, puis desactiver et enregistrer. Verifier aussi que le message envoye contient bien l'emoji et que Ctrl+Z reste utilisable. Messenger peut faire evoluer son editeur : une verification dans un compte connecte reste necessaire apres ses mises a jour.

`extension/options.html` peut etre ouvert directement pour un apercu de l'interface. Cet apercu utilise un stockage distinct et ne configure pas l'extension installee.

## Icones

Icones Lucide sous licence ISC, conservee dans `extension/icons/LICENSE`.