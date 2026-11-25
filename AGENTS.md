# Guide pour les agents IA

## Règle obligatoire de maintenance

Toute modification du projet doit inclure une mise à jour de `AGENTS.md` dans le
même ensemble de changements. Vérifier l'ensemble de ce guide et adapter les
sections concernées à l'état réel du projet : architecture, comportement,
commandes, tests, permissions et documentation. Si aucune description existante
ne change, ajouter une brève mention de la modification et de son impact dans
ce guide. Ne pas laisser des instructions ou des exemples devenus obsolètes.

Avant de modifier le projet, lire ce guide, le `README.md` et les fichiers
concernés. Vérifier l'état du dépôt et préserver les changements préexistants.
Faire des modifications ciblées, suivre les conventions existantes et maintenir
les deux guides utilisateurs, `README.md` (anglais, par défaut) et
`README.fr.md` (français), cohérents lorsque le comportement ou la documentation change. Ne
pas ajouter de dépendance ou de processus de compilation sans nécessité.

## Objectif et fonctionnement

Messenger Emoji est une extension Chrome Manifest V3 qui remplace, pendant la
saisie, des raccourcis personnalisés par leur texte de remplacement dans
`https://www.messenger.com/` uniquement. Elle ne doit pas envoyer de message,
modifier les champs de recherche ou remplacer le contenu collé. Les réglages
sont locaux ; l'extension ne possède ni serveur ni télémétrie.

Les raccourcis sont littéraux et sensibles à la casse. Le moteur recherche une
correspondance à la fin du texte avant le curseur et choisit la plus longue.
Un raccourci commençant par une lettre, un chiffre ou `_` ne correspond pas
si le caractère précédent est aussi une lettre, un chiffre ou `_`. Les
associations par défaut sont `:cwl:`, `:sob:`, `:heart:`, `:smile:` et
`:thumbsup:`.
Dans l'éditeur de message, `:` ouvre un bandeau des associations configurées
commençant par `:` ; la saisie filtre les raccourcis par préfixe, et un clic
remplace uniquement le préfixe avant le curseur. Lorsque le bandeau est ouvert,
appuyer sur Entrée depuis l'éditeur valide directement la première suggestion
affichée au lieu d'envoyer le message (`Shift+Entrée` reste libre pour le retour
à la ligne). La touche Tab permet aussi de parcourir les suggestions puis de
valider le bouton ciblé avec Entrée, et Échap ferme le bandeau. Les suggestions
suivent le commutateur de remplacement et les changements de réglages.

## Organisation

- `extension/manifest.json` : permission `storage`, popup et page d'options,
  et injection de `rules.js` puis `content.js` sur Messenger à `document_idle`.
- `extension/rules.js` : valeurs par défaut, normalisation des réglages et
  recherche de remplacements et de suggestions ; API globale `MessengerEmojiRules`, également
  exportée en CommonJS pour les tests Node.
- `extension/content.js` : écoute de la saisie et des changements de stockage,
  sélection de l'éditeur et remplacement au curseur. L'éditeur doit être un
  `contenteditable` de rôle `textbox`, multiligne ou Lexical. Le remplacement
  est différé après l'événement de saisie et utilise `execCommand("insertText")`
  pour s'intégrer à l'édition et à l'annulation du navigateur. Il gère également
  le bandeau de suggestions, positionné près de l'éditeur et mis à jour selon
  la sélection, la saisie et les réglages.
- `extension/content.css` : styles du bandeau injectés sur Messenger par le
  manifest et chargés également dans la page de test navigateur.
- `extension/options.html`, `extension/options.css`, `extension/options.js` :
  interface française de gestion des associations et de l'activation, avec
  validation, état non enregistré, retour d'erreur et réinitialisation.
- `extension/icons/` : icônes Lucide et licence ISC.
- `tests/rules.test.cjs` : tests Node du moteur.
- `tests/browser.html` : tests du moteur dans le navigateur et éditeur de test
  avec un stockage Chrome simulé pour exercer le script de contenu ; un bouton
  lance les tests de suggestions dans un éditeur temporaire.

## Réglages et points de vigilance

Les réglages sont enregistrés sous la clé `settings` de `chrome.storage.local`,
sous la forme `{ formatVersion: 2, enabled, mappings: [{ shortcut, emoji }] }`.
Les anciens réglages sans version 2 convertissent à la lecture les raccourcis
encadrés de parenthèses en raccourcis encadrés de deux-points, même pour les
associations personnalisées. En cas de conflit, l'association déjà écrite avec
des deux-points est conservée. La conversion est persistée à l'enregistrement
des réglages ; les nouveaux raccourcis personnalisés restent libres. Le script de
contenu écoute les changements pour les appliquer aux onglets ouverts. En
aperçu direct de `options.html`, `localStorage` utilise la clé distincte
`messenger-emoji-preview` et ne configure pas l'extension installée.

La normalisation conserve une liste volontairement vide, retire les entrées
invalides ou les doublons et limite chaque chaîne à 80 unités JavaScript ; un
raccourci ne peut pas contenir de saut de ligne. Conserver la cohérence entre
le moteur, les champs et leur validation lors de toute évolution du format.
Attention aux sélections, aux nœuds de texte multiples, aux retours à la ligne,
à la composition IME, aux événements de saisie et à l'annulation : l'éditeur
Messenger peut évoluer et les tests isolés ne remplacent pas un essai réel.

Préserver le périmètre d'accès limité à Messenger et la confidentialité des
réglages. Toute nouvelle permission ou tout changement de collecte ou de
stockage doit être justifié et documenté.

## Installation et vérification

Il n'y a pas de compilation ni de dépendances à installer. Dans
`chrome://extensions`, activer le mode développeur et charger le dossier
`extension` comme extension non empaquetée. Après une modification de
l'extension, la recharger dans Chrome puis recharger l'onglet Messenger.

Selon les fichiers modifiés :

1. Exécuter `node --test tests/rules.test.cjs` avec Node.js 18 ou plus pour les
   règles. Ajouter des tests ciblés si leur comportement change.
2. Ouvrir `tests/browser.html` dans un navigateur : vérifier les résultats
   affichés et exercer l'éditeur de test pour les changements de saisie, de
   filtrage des suggestions, de validation par Entrée et de sélection à la souris.
3. Vérifier dans Messenger connecté : saisir un raccourci ou valider une
   suggestion avec Entrée sans envoyer le message, modifier et enregistrer une
   association sans recharger, puis désactiver et enregistrer. Vérifier aussi
   l'envoi du texte remplacé et `Ctrl+Z`. Tester les champs de recherche, le
   collage et la composition si la saisie est concernée.
4. Pour l'interface, vérifier également la validation, les erreurs, les
   modifications non enregistrées et, si pertinent, l'aperçu direct.

Préciser dans le compte rendu les vérifications réellement effectuées et celles
qui nécessitent encore un navigateur ou un compte Messenger connecté.
