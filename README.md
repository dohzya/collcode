Code collaboratif
=================

> Ace + Firepad in a cool way

L'idée est de pouvoir parler d'un bout de code et de pouvoir le modifier
à distance.

L'éditeur est [Ace](http://ace.c9.io) et la partie collaboration est gérée par
[Firepad](firepad.io).

Utilisation
-----------

La page va créer si besoin un nouveau document Firepad.

Pour partager un document avec quelqu'un, il suffit de lui donner l'URL de la
page.

Il y a (pour l'instant) 3 paramètres :

- les raccourcis claviers (sauvegardé dans le local storage)
- le type de fichier (sauvegardé dans le document Firepad)
- le thème (sauvegardé dans le local storage)

Les raccourcis et le thème sont donc conservés entre les différents documents
tandis que le type de fichier est conservé entre les différentes personnes
travaillant dessus.

Kill
----

Le bouton `kill` supprime le document Firepad. La page devient immédiatement
inaccessible pour tous les clients et son contenu est perdu.

Merci de supprimer vos documents quand vous avez fini :-)
(vous pouvez aussi réutiliser le même document entre plusieurs sessions :p)
