<header>
<div align="center">
<img src="docs/assets/logo.png" alt="logo" height="60" align="center">
<h1 align="center">Teletape</h1>
<p>This script is designed to add a news feed to your Telegram.</p>
</div>
</header>

## My idea

With more and more channels, it's harder and harder to keep track of them all. You have to go to each channel and read it separately. I had the idea to make a newsfeed that would make this experience easier. Reading posts on Telegram has become even more convenient!

<img src="docs/assets/demonstration.jpg?raw=true" alt="demonstration" height="150">

## What's in it for you?

- Share your newsfeed with your friends!
- Remove everything unnecessary to the second account, and leave only the news feed on yourself!
- Read the news as it comes in, not separately in each channel!
- Fast forward to the source of the news!
- Hide what you don't like!

## Installing

1. Install packages:

```bash
$ npm i
```

2. Run authorization script:

```bash
$ node login.js
```

3. Pass the authorization
4. Run the working script:

```bash
$ node app.js
```

5. Create a channel and write the command **/mytape** there

## Bot commands:

- **/mytape** - Sets the channel as a news feed.
- **/ignore** - When mentioning the post, ignores the source.

## Why doesn't the script work?

- The session is over. You need to re-login to your account using the **login.js** script!
- You are not authorized. Log in to your account using the **login.js** script!
- You did not add the channel as a news feed. After running the **app.js** script, send the **/mytape** command to the channel you want to make a news feed.
