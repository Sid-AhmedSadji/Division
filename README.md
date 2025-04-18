# 🎮 Jeu de Division

## Description

Le **Jeu de Division** est un projet interactif et ludique dans lequel chaque manche met les joueurs au défi de résoudre une opération de division générée aléatoirement par le serveur… le tout dans un **temps limité**. Rapidité et précision sont les clés pour marquer des points et grimper dans la difficulté !

---

## Fonctionnalités

- 🎲 **Divisions aléatoires** : Le serveur génère des opérations de division aléatoires à chaque manche.
  - **Numérateur** compris entre **10 et 99**  
  - **Dénominateur** compris entre **1 et 9**
- ⏱️ **Temps limité** : Chaque joueur dispose de **30 secondes** pour répondre à la division.
  - *Le temps limite et la difficulté peuvent être ajustés dans `server/server.js`.*
- 🧠 **Difficulté progressive** :
  - **Première manche** : Tous les joueurs commencent avec **0 point** et doivent uniquement donner **la partie entière** du résultat (ex. : pour `53 ÷ 8`, la réponse attendue est `6`).
  - **À chaque point gagné**, la difficulté augmente : le joueur devra fournir **un chiffre de plus après la virgule**.  
    - Exemple : un joueur avec **2 points** devra répondre avec **2 décimales** (ex. : `53 ÷ 8 = 6.62`)
- 📝 **Sauvegarde des réponses** : Chaque réponse est enregistrée dans un fichier log `server/game_log.log`.
- 🏆 **Points et félicitations** :
  - Toute bonne réponse rapporte **1 point**.
  - Le joueur le **plus rapide** à répondre correctement reçoit une **félicitation spéciale** ✨.
- ✅ **Début conditionné** : La partie ne commence que lorsque **tous les joueurs sont prêts**.
- 📡 **Communication en temps réel** : Utilisation de **Socket.IO** pour une synchronisation fluide entre le serveur et les clients.

---

## Prérequis

Avant de commencer, assurez-vous d’avoir :

- Node.js (version 14 ou supérieure)

---

## Installation

Clonez le projet et installez les dépendances :

```sh
# Clonez le dépôt
git clone https://github.com/Sid-AhmedSadji/Division.git

# Accédez au répertoire du projet
cd Division

# Installez les dépendances du serveur
cd server
npm install

# Installez les dépendances du client
cd ../client
npm install
```

---

## Lancement du projet

### Démarrage côté serveur :

```sh
cd server
npm start
```

### Démarrage côté client :

```sh
cd client
npm run dev
```

Le serveur et le client se synchronisent automatiquement pour une expérience de jeu complète.

---

## Technologies utilisées

### **Côté serveur** :

- **Node.js** – Environnement d'exécution côté serveur
- **Express** – Framework web minimaliste
- **Socket.IO** – Communication en temps réel
- **Cors** – Gestion des politiques CORS
- **File System (fs)** – Pour enregistrer les réponses dans `game_log.log`

### **Côté client** :

- **React** – Interface utilisateur dynamique
- **Vite** – Serveur de développement rapide
- **TypeScript** – Typage statique fiable
- **Tailwind CSS** – Styling rapide et moderne

---

## Auteur

- **SADJI Sid-Ahmed**  

---

## Idées d’amélioration

- 🔁 Lancer plusieurs parties consécutives sans redémarrer le serveur
- 📊 Ajouter un **tableau de scores global**
- 📈 Introduire un système de **niveaux** ou de **bonus/malus**
- 🧩 Ajouter des **modes de jeu** alternatifs : en équipe, en duel, etc.
